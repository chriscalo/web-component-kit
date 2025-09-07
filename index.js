/**
 * Web Component Kit
 * A reactive template binding system and web component toolkit for rapid HTML prototyping.
 * 
 * Provides:
 * - Reactive template bindings (interpolation, property, event, attribute, conditional, two-way, list)
 * - DOM utilities (parseToFragment, updateIDs, fetchText)
 * - Component coordination (componentsReady)
 * 
 * @requires @vue/reactivity
 */

// Import Vue reactivity from CDN for browser usage
const vueReactivityUrl = 'https://unpkg.com/@vue/reactivity@3.4.21/dist/reactivity.esm-browser.prod.js';
const vueModule = await import(vueReactivityUrl);
const { reactive, effect } = vueModule;

// Base plugin class
export class BindingPlugin {
  constructor(name, selector) {
    this.name = name;
    this.selector = selector;
  }
  
  discover(root) {
    if (!this.selector) return [];
    return [...root.querySelectorAll(this.selector)];
  }
  
  initialize(element, instance) {
    // Override in subclasses
    return {};
  }
  
  update(element, instance, metadata) {
    // Override in subclasses
  }
  
  cleanup(element, metadata) {
    // Override in subclasses
  }
}

// Text interpolation plugin for {{ expression }}
export class InterpolationPlugin extends BindingPlugin {
  constructor() {
    super("interpolation", null);
  }

  discover(root) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return /\{\{.*?\}\}/.test(node.textContent) 
            ? NodeFilter.FILTER_ACCEPT 
            : NodeFilter.FILTER_REJECT;
        },
      },
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    return textNodes;
  }
  
  initialize(textNode, instance) {
    const text = textNode.textContent;
    const parts = [];
    
    let lastIndex = 0;
    const regex = /\{\{(.*?)\}\}/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'static',
          content: text.slice(lastIndex, match.index),
        });
      }
      
      parts.push({
        type: 'expression',
        content: match[1].trim(),
        // literal double curlies breaks VS Code syntax highlighting
        placeholder: "{".repeat(2) + match[1] + "}".repeat(2),
      });
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push({
        type: 'static',
        content: text.slice(lastIndex),
      });
    }
    
    const nodes = [];
    const parent = textNode.parentNode;
    const nextSibling = textNode.nextSibling;
    
    parts.forEach(part => {
      const node = document.createTextNode(
        part.type === 'static' ? part.content : part.placeholder
      );
      parent.insertBefore(node, nextSibling);
      nodes.push({
        node,
        ...part,
      });
    });
    
    parent.removeChild(textNode);
    
    return {
      parts: nodes,
      originalText: text,
    };
  }
  
  update(originalTextNode, instance, metadata) {
    metadata.parts.forEach(part => {
      if (part.type === 'expression') {
        try {
          const func = new Function('instance', `with (instance) { return ${part.content}; }`);
          const value = func(instance);
          part.node.textContent = value != null ? String(value) : '';
        } catch (error) {
          part.node.textContent = part.placeholder;
        }
      }
    });
  }
}

// Property binding plugin for .property="value"
export class PropertyBindingPlugin extends BindingPlugin {
  constructor() {
    super("property", null);
  }
  
  discover(root) {
    const elements = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      null,
    );
    
    let node;
    while (node = walker.nextNode()) {
      for (const attr of node.attributes) {
        if (attr.name.startsWith(".")) {
          elements.push({ element: node, attribute: attr.name });
        }
      }
    }
    return elements;
  }
  
  initialize({ element, attribute }, instance) {
    const expression = element.getAttribute(attribute);
    const propName = attribute.slice(1); // Remove the '.'
    
    return {
      attribute,
      propName,
      expression,
      originalValue: element[propName],
    };
  }
  
  update(element, instance, metadata) {
    const { propName, expression } = metadata;
    
    try {
      const func = new Function("instance", `
        with (instance) {
          return ${expression};
        }
      `);
      const value = func(instance);
      element[propName] = value;
    } catch (error) {
      console.warn(
        `Property binding error for ${propName}:`,
        error.message
      );
      element[propName] = metadata.originalValue;
    }
  }
}

// Event binding plugin for on:event="handler"
export class EventBindingPlugin extends BindingPlugin {
  constructor() {
    super("event", null);
  }
  
  discover(root) {
    const elements = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      null,
    );
    
    let node;
    while (node = walker.nextNode()) {
      for (const attr of node.attributes) {
        if (attr.name.startsWith("on:")) {
          elements.push({ element: node, attribute: attr.name });
        }
      }
    }
    return elements;
  }
  
  initialize({ element, attribute }, instance) {
    const expression = element.getAttribute(attribute);

    const eventName = attribute.slice(3); // Remove 'on:'
    
    const handler = (event) => {
      try {
        const func = new Function("instance", "event", `
          with (instance) {
            ${expression};
          }
        `);
        func(instance, event);
      } catch (error) {
        console.warn(`Event handler error for ${eventName}:`, error.message);
      }
    };
    
    element.addEventListener(eventName, handler);
    
    return {
      attribute,
      eventName,
      expression,
      handler,
    };
  }
  
  update(element, instance, metadata) {
    // Event handlers don't need updates
  }
  
  cleanup(element, metadata) {
    element.removeEventListener(metadata.eventName, metadata.handler);
  }
}

// AttributeBindingPlugin - minimal implementation for TDD
export class AttributeBindingPlugin extends BindingPlugin {
  constructor() {
    super("attribute", null);
  }
  
  discover(root) {
    const elements = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      null,
    );
    
    let node;
    while (node = walker.nextNode()) {
      for (const attr of node.attributes) {
        if (attr.name.startsWith("[") && attr.name.endsWith("]")) {
          elements.push({ element: node, attribute: attr.name });
        }
      }
    }
    return elements;
  }
  
  initialize({ element, attribute }, instance) {
    const expression = element.getAttribute(attribute);
    const attrName = attribute.slice(1, -1); // Remove [ and ]
    
    return {
      attribute,
      attrName,
      expression,
    };
  }
  
  update(element, instance, metadata) {
    try {
      const func = new Function("instance", `
        with (instance) {
          return ${metadata.expression};
        }
      `);
      const value = func(instance);
      
      if (value !== null && value !== undefined && value !== false) {
        element.setAttribute(metadata.attrName, String(value));
      } else {
        element.removeAttribute(metadata.attrName);
      }
    } catch (error) {
      // Leave attribute unchanged on error
      console.warn(`Attribute binding error for ${metadata.attrName}:`, error.message);
    }
  }
  
  cleanup(element, metadata) {
    // Attribute bindings don't need cleanup
  }
}

// ConditionalRenderingPlugin - minimal implementation for TDD
export class ConditionalRenderingPlugin extends BindingPlugin {
  constructor() {
    super("conditional", null);
  }
  
  discover(root) {
    const elements = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      null,
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.hasAttribute("@if")) {
        elements.push({ element: node, attribute: "@if" });
      }
    }
    return elements;
  }
  
  initialize({ element, attribute }, instance) {
    const expression = element.getAttribute(attribute);
    const comment = document.createComment(`@if ${expression}`);
    const originalHTML = element.outerHTML;
    
    return {
      element,
      comment,
      expression,
      isVisible: true,
      originalHTML,
      instance
    };
  }
  
  update(element, instance, metadata) {
    try {
      const func = new Function("instance", `
        with (instance) {
          return !!${metadata.expression};
        }
      `);
      const shouldShow = func(instance);
      
      // Get parentNode dynamically (it may not exist during initialize)
      const parentNode = metadata.element.parentNode || metadata.comment.parentNode;
      
      if (shouldShow && !metadata.isVisible) {
        // Show element - recreate from original HTML and re-bind
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = metadata.originalHTML;
        const newElement = tempDiv.firstElementChild;
        
        // Re-discover and initialize bindings for the new element
        const nestedBindings = [];
        for (const [name, plugin] of bindingPlugins) {
          if (plugin.constructor.name === 'ConditionalRenderingPlugin') continue;
          const elements = plugin.discover(newElement);
          for (const nestedElement of elements) {
            const domElement = nestedElement.element || nestedElement;
            const nestedMetadata = plugin.initialize(nestedElement, instance);
            nestedBindings.push({
              plugin,
              metadata: nestedMetadata,
              element: domElement
            });
          }
        }
        
        // Replace comment with new element
        parentNode.replaceChild(newElement, metadata.comment);
        metadata.element = newElement;
        metadata.isVisible = true;
        metadata.nestedBindings = nestedBindings;
        
        // Update nested bindings immediately
        for (const binding of nestedBindings) {
          binding.plugin.update(binding.element, instance, binding.metadata);
        }
      } else if (!shouldShow && metadata.isVisible) {
        // Hide element - replace element with comment
        parentNode.replaceChild(metadata.comment, metadata.element);
        metadata.isVisible = false;
        metadata.nestedBindings = null;
      }
      
      // Update nested bindings when element is visible
      if (metadata.isVisible && metadata.nestedBindings) {
        for (const binding of metadata.nestedBindings) {
          binding.plugin.update(binding.element, instance, binding.metadata);
        }
      }
    } catch (error) {
      console.warn(`Conditional rendering error for ${metadata.expression}:`, error.message);
    }
  }
  
  cleanup(element, metadata) {
    // Conditional rendering doesn't need cleanup
  }
}

// TwoWayBindingPlugin - combines property/attribute binding with event handling
export class TwoWayBindingPlugin extends BindingPlugin {
  constructor() {
    super("twoway", null);
  }
  
  discover(root) {
    const elements = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      null,
    );
    
    let node;
    while (node = walker.nextNode()) {
      for (const attr of node.attributes) {
        // Look for patterns like .value:input or [class]:click
        if (attr.name.match(/^[\.\[].*:.*$/)) {
          elements.push({ element: node, attribute: attr.name });
        }
      }
    }
    return elements;
  }
  
  initialize({ element, attribute }, instance) {
    const expression = element.getAttribute(attribute);
    const [binding, eventName] = attribute.split(':');
    
    let isProperty = binding.startsWith('.');
    let isAttribute = binding.startsWith('[') && binding.endsWith(']');
    let bindingName;
    
    if (isProperty) {
      bindingName = binding.slice(1); // Remove '.'
    } else if (isAttribute) {
      bindingName = binding.slice(1, -1); // Remove '[' and ']'
    }
    
    // Set up the initial binding (property or attribute)
    if (isProperty) {
      const value = this.evaluateExpression(expression, instance);
      element[bindingName] = value;
    } else if (isAttribute) {
      const value = this.evaluateExpression(expression, instance);
      if (value !== null && value !== undefined && value !== false) {
        element.setAttribute(bindingName, String(value));
      } else {
        element.removeAttribute(bindingName);
      }
    }
    
    // Set up the event handler for two-way binding
    const handler = (event) => {
      try {
        let newValue;
        if (isProperty) {
          newValue = element[bindingName];
        } else if (isAttribute) {
          newValue = element.getAttribute(bindingName);
        }
        
        // Update the instance property
        const func = new Function("instance", "value", `
          with (instance) {
            ${expression} = value;
          }
        `);
        func(instance, newValue);
      } catch (error) {
        console.warn(`Two-way binding error for ${eventName}:`, error.message);
      }
    };
    
    element.addEventListener(eventName, handler);
    
    return {
      attribute,
      binding,
      eventName,
      bindingName,
      expression,
      handler,
      isProperty,
      isAttribute,
    };
  }
  
  evaluateExpression(expression, instance) {
    try {
      const func = new Function("instance", `
        with (instance) {
          return ${expression};
        }
      `);
      return func(instance);
    } catch (error) {
      return null;
    }
  }
  
  update(element, instance, metadata) {
    const { bindingName, expression, isProperty, isAttribute } = metadata;
    
    // Update the binding when data changes
    if (isProperty) {
      const value = this.evaluateExpression(expression, instance);
      element[bindingName] = value;
    } else if (isAttribute) {
      const value = this.evaluateExpression(expression, instance);
      if (value !== null && value !== undefined && value !== false) {
        element.setAttribute(bindingName, String(value));
      } else {
        element.removeAttribute(bindingName);
      }
    }
  }
  
  cleanup(element, metadata) {
    element.removeEventListener(metadata.eventName, metadata.handler);
  }
}

// ListRenderingPlugin - renders template for each item in an iterable
export class ListRenderingPlugin extends BindingPlugin {
  constructor() {
    super("list", null);
  }
  
  discover(root) {
    const elements = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      null,
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.hasAttribute("@for")) {
        elements.push({ element: node, attribute: "@for" });
      }
    }
    return elements;
  }
  
  initialize({ element, attribute }, instance) {
    const expression = element.getAttribute(attribute);
    // Parse "@for" syntax: "item in items"
    const [itemVar, , iterableExpr] = expression.split(' ');
    
    // Store the original template
    const template = element.cloneNode(true);
    template.removeAttribute("@for");
    
    // Replace the element with a comment placeholder
    const comment = document.createComment(`@for ${expression}`);
    const parent = element.parentNode;
    parent.insertBefore(comment, element);
    parent.removeChild(element);
    
    return {
      attribute,
      expression,
      itemVar,
      iterableExpr,
      template,
      comment,
      parent,
      instance,
      renderedElements: []
    };
  }
  
  update(element, instance, metadata) {
    const { itemVar, iterableExpr, template, comment, parent } = metadata;
    
    // Clear existing rendered elements
    metadata.renderedElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    metadata.renderedElements = [];
    
    try {
      // Evaluate the iterable expression
      const func = new Function("instance", `
        with (instance) {
          return ${iterableExpr};
        }
      `);
      let items = func(instance);
      
      // Handle different iterable types
      if (Array.isArray(items)) {
        // Arrays work as-is
      } else if (items && typeof items === 'object') {
        // Convert object to array of values
        items = Object.values(items);
      } else {
        console.warn(`List rendering expected array or object, got: ${typeof items}`);
        return;
      }
      
      // Render each item
      let insertAfter = comment;
      items.forEach((item, index) => {
        const itemElement = template.cloneNode(true);
        
        // Create scope with loop variable
        const itemScope = Object.create(instance);
        itemScope[itemVar] = item;
        itemScope.$index = index;
        
        // Process nested bindings in the item element
        this.processNestedBindings(itemElement, itemScope);
        
        // Insert the element after the last inserted element
        parent.insertBefore(itemElement, insertAfter.nextSibling);
        insertAfter = itemElement;
        metadata.renderedElements.push(itemElement);
      });
    } catch (error) {
      console.warn(`List rendering error for ${iterableExpr}:`, error.message);
    }
  }
  
  processNestedBindings(element, scope) {
    // Process text interpolation
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const interpolationRegex = /\{\{([^}]+)\}\}/g;
      
      if (interpolationRegex.test(text)) {
        const newText = text.replace(interpolationRegex, (match, expression) => {
          try {
            const func = new Function("scope", `
              with (scope) {
                return ${expression.trim()};
              }
            `);
            const value = func(scope);
            return value != null ? String(value) : '';
          } catch (error) {
            return match; // Return placeholder on error
          }
        });
        textNode.textContent = newText;
      }
    });
    
    // Process attribute bindings
    const elementsWalker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null
    );
    const elements = [];
    let elemNode;
    while (elemNode = elementsWalker.nextNode()) {
      elements.push(elemNode);
    }
    
    elements.forEach(elemNode => {
      const attributes = Array.from(elemNode.attributes);
      attributes.forEach(attr => {
        if (attr.name.startsWith('[') && attr.name.endsWith(']')) {
          const attrName = attr.name.slice(1, -1);
          const expression = attr.value;
          
          try {
            const func = new Function("scope", `
              with (scope) {
                return ${expression};
              }
            `);
            const value = func(scope);
            
            if (value === false || value == null) {
              elemNode.removeAttribute(attrName);
            } else {
              elemNode.setAttribute(attrName, String(value));
            }
            elemNode.removeAttribute(attr.name);
          } catch (error) {
            // Keep original attribute on error
          }
        }
      });
    });
  }
  
  cleanup(element, metadata) {
    // Clean up rendered elements
    metadata.renderedElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }
}

// Plugin registry
export const bindingPlugins = new Map();
bindingPlugins.set("interpolation", new InterpolationPlugin());
bindingPlugins.set("property", new PropertyBindingPlugin());
bindingPlugins.set("event", new EventBindingPlugin());
bindingPlugins.set("attribute", new AttributeBindingPlugin());
bindingPlugins.set("conditional", new ConditionalRenderingPlugin());
bindingPlugins.set("twoway", new TwoWayBindingPlugin());
bindingPlugins.set("list", new ListRenderingPlugin());

// Main bindTemplate function
export function bindTemplate(templateSelector, instance) {
  const templateEl = typeof templateSelector === "string"
    ? document.querySelector(templateSelector)
    : templateSelector;
  const root = templateEl.content.cloneNode(true);
  const boundElements = new Map();
  
  // Discovery phase
  for (const [name, plugin] of bindingPlugins) {
    const elements = plugin.discover(root);
    for (const element of elements) {
      const domElement = element.element || element;
      if (!boundElements.has(domElement)) {
        boundElements.set(domElement, []);
      }
      const metadata = plugin.initialize(element, instance);
      boundElements.get(domElement).push({
        plugin,
        metadata,
        element: domElement,
      });
    }
  }
  
  // Attach to instance
  instance.appendChild(root);
  
  // Convert to live bindings
  const liveBindings = new Map();
  for (const [element, bindings] of boundElements) {
    if (!liveBindings.has(element)) {
      liveBindings.set(element, []);
    }
    liveBindings.get(element).push(...bindings);
  }
  
  // Return reactive render function
  let renderEffect;
  return function render() {
    if (renderEffect) {
      renderEffect.stop?.();
    }
    
    renderEffect = effect(() => {
      for (const [element, bindings] of liveBindings) {
        for (const { plugin, metadata } of bindings) {
          plugin.update(element, instance, metadata);
        }
      }
    });
    
    // Force initial update to ensure property bindings work on first render
    if (!renderEffect.ran) {
      for (const [element, bindings] of liveBindings) {
        for (const { plugin, metadata } of bindings) {
          plugin.update(element, instance, metadata);
        }
      }
      renderEffect.ran = true;
    }
  };
}

// DOM Utilities
export function parseToFragment(htmlString) {
  const fragment = new DocumentFragment();
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;
  while (tempDiv.firstChild) {
    fragment.appendChild(tempDiv.firstChild);
  }
  return fragment;
}

export function updateIDs(element) {
  for (const icon of element.querySelectorAll("[id]")) {
    const { id } = icon;
    icon.id = `lucide-${id}`;
  }
  
  return element;
}

export async function fetchText(url) {
  const response = await fetch(url);
  if (response.ok) {
    return response.text();
  } else {
    const msg = `Failed to fetch:
  URL:    ${url}
  Status: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }
}

// Component utilities
export async function componentsReady(...names) {
  await Promise.all(names.map(name => customElements.whenDefined(name)));
  console.debug(`✅ componentsReady(${ names.join(", ") })`);
}

// Load and inject HTML component fragments
export async function loadComponent(url) {
  const html = await fetchText(url);
  const fragment = parseToFragment(html);
  
  // Extract and inject templates
  const templates = fragment.querySelectorAll('template');
  templates.forEach(template => {
    document.body.appendChild(template);
  });
  
  // Extract and inject styles
  const styles = fragment.querySelectorAll('style');
  styles.forEach(style => {
    document.head.appendChild(style);
  });
  
  // Extract and execute scripts
  const scripts = fragment.querySelectorAll('script');
  const scriptPromises = [];
  
  scripts.forEach(script => {
    if (script.type === 'module' || !script.type) {
      const newScript = document.createElement('script');
      newScript.type = 'module';
      newScript.textContent = script.textContent;
      scriptPromises.push(new Promise((resolve) => {
        newScript.onload = resolve;
        newScript.onerror = resolve;
        document.body.appendChild(newScript);
        // Module scripts don't fire load events for inline content
        setTimeout(resolve, 0);
      }));
    }
  });
  
  await Promise.all(scriptPromises);
}

// Process wck-include directives in the document
export async function processIncludes() {
  const includes = document.querySelectorAll('wck-include[src]');
  const promises = [];
  
  for (const include of includes) {
    const src = include.getAttribute('src');
    if (src) {
      promises.push(loadComponent(src).then(() => {
        // Remove the include element after loading
        include.remove();
      }));
    }
  }
  
  await Promise.all(promises);
}

// Auto-process includes on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processIncludes);
} else {
  processIncludes();
}

// Make reactive available for convenience
export { reactive, effect };