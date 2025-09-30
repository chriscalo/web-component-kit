# Web Component Kit - Complete Feature List

This document provides a comprehensive list and description of every feature available in the Web Component Kit codebase.

## Core Features

### 1. Reactive Template Binding System

The heart of the Web Component Kit is its reactive template binding system, powered by Vue 3's reactivity system. It provides declarative bindings that automatically update the DOM when data changes.

#### 1.1 Text Interpolation (`{{ expression }}`)

**Description:** Renders reactive text content using double curly brace syntax. Expressions are evaluated in the context of the component instance and automatically update when dependencies change.

**Syntax:**
```html
<span>{{ message }}</span>
<p>Count: {{ count * 2 }}</p>
```

**Features:**
- Supports JavaScript expressions
- Automatic escaping of HTML
- Multiple interpolations in a single text node
- Graceful error handling with placeholder fallback

**Implementation:** `InterpolationPlugin` class

#### 1.2 Property Binding (`.property="expression"`)

**Description:** Binds JavaScript object properties to element properties. Uses a leading dot syntax to distinguish property binding from attribute binding.

**Syntax:**
```html
<input .value="inputText">
<button .disabled="isLoading">
<custom-element .data="complexObject">
```

**Features:**
- Direct property assignment (not HTML attributes)
- Works with any DOM property
- Supports complex objects and arrays
- Reactive updates on data changes

**Implementation:** `PropertyBindingPlugin` class

#### 1.3 Event Binding (`on:event="handler"`)

**Description:** Attaches event listeners to elements using declarative syntax. Event handlers are executed in the context of the component instance with access to the event object.

**Syntax:**
```html
<button on:click="handleClick()">Click me</button>
<input on:input="updateValue(event)">
<form on:submit="handleSubmit(event)">
```

**Features:**
- Supports all standard DOM events
- Access to event object via `event` parameter
- Automatic cleanup on component removal
- Error handling with console warnings

**Implementation:** `EventBindingPlugin` class

#### 1.4 Attribute Binding (`[attribute]="expression"`)

**Description:** Binds values to HTML attributes using bracket syntax. Unlike property binding, this updates HTML attributes which is important for accessibility and CSS selectors.

**Syntax:**
```html
<div [class]="dynamicClass"></div>
<img [src]="imageUrl">
<button [title]="tooltipText">
<div [data-status]="status">
```

**Features:**
- Updates HTML attributes (visible in inspector)
- Automatically removes attribute when value is `null`, `undefined`, or `false`
- Converts values to strings
- Important for ARIA attributes and CSS attribute selectors

**Implementation:** `AttributeBindingPlugin` class

#### 1.5 Conditional Rendering (`@if="condition"`)

**Description:** Shows or hides elements based on a boolean condition. Elements are completely removed from the DOM when the condition is false and recreated when it becomes true.

**Syntax:**
```html
<div @if="isVisible">Conditionally shown</div>
<p @if="count > 10">Count is greater than 10</p>
<section @if="user.isAdmin">Admin panel</section>
```

**Features:**
- Complete DOM removal (not just CSS hiding)
- Preserves original element structure
- Automatically rebinds nested bindings when shown
- Uses comment placeholder for tracking
- Nested bindings work correctly

**Implementation:** `ConditionalRenderingPlugin` class

#### 1.6 List Rendering (`@for="item in items"`)

**Description:** Renders a template for each item in an array or object. Creates a scoped context for each item with access to the item value and index.

**Syntax:**
```html
<ul>
  <li @for="item in items">
    {{ item.name }} - ${{ item.price }}
  </li>
</ul>
```

**Features:**
- Iterates over arrays and objects
- Provides scoped `item` variable
- Provides `$index` variable for position
- Supports nested bindings within items
- Automatic cleanup of previous renders
- Uses comment placeholder for tracking

**Implementation:** `ListRenderingPlugin` class

#### 1.7 Two-Way Binding (`.property:event="model"`)

**Description:** Combines property/attribute binding with event handling to create two-way data flow. Updates the model when user input changes and updates the UI when model changes.

**Syntax:**
```html
<input .value:input="searchQuery">
<select .value:change="selectedOption">
<textarea .value:input="description">
```

**Features:**
- Automatic synchronization in both directions
- Works with properties and attributes
- Supports custom events
- Commonly used for form inputs
- Reduces boilerplate code

**Implementation:** `TwoWayBindingPlugin` class

---

### 2. Core Functions

#### 2.1 `bindTemplate(templateSelector, instance)`

**Description:** The main function that binds a template to a DOM element with reactive data. It discovers all bindings, initializes them, and returns a render function that sets up reactive updates.

**Parameters:**
- `templateSelector`: String selector or `<template>` element
- `instance`: HTMLElement that serves as both the binding context (data source) and container (where content is appended)

**Returns:** A `render()` function that initializes reactive effects

**Usage:**
```javascript
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.data = reactive({ count: 0 });
    const render = bindTemplate('template[name="my-template"]', this);
    render(); // Start reactive updates
  }
}
```

**Features:**
- Automatic binding discovery
- Plugin-based architecture
- Reactive effect management
- Cleanup handling
- Multiple binding types per element

#### 2.2 `reactive(object)`

**Description:** Creates a reactive proxy object using Vue 3's reactivity system. Changes to reactive objects trigger automatic UI updates.

**Parameters:**
- `object`: Plain JavaScript object to make reactive

**Returns:** Reactive proxy of the object

**Usage:**
```javascript
const state = reactive({
  count: 0,
  items: [],
  user: { name: 'John' }
});
```

**Features:**
- Deep reactivity (nested objects)
- Array method support
- Direct property access
- Automatic dependency tracking
- Re-exported from Vue 3

#### 2.3 `effect(fn)`

**Description:** Creates a reactive effect that automatically re-runs when its dependencies change. Used internally by the binding system.

**Parameters:**
- `fn`: Function to run reactively

**Returns:** Effect object with `stop()` method

**Features:**
- Automatic dependency tracking
- Can be stopped manually
- Re-exported from Vue 3

---

### 3. Component Loading System

#### 3.1 `loadComponent(url)`

**Description:** Loads an HTML component file from a URL and injects its parts (templates, styles, scripts) into the current document.

**Parameters:**
- `url`: Path to the component HTML file

**Returns:** Promise that resolves when component is loaded

**Usage:**
```javascript
await loadComponent('./my-component.html');
```

**Features:**
- Extracts and injects `<template>` elements into `<body>`
- Extracts and injects `<style>` elements into `<head>`
- Executes `<script type="module">` elements
- Async module script support
- Error handling for failed fetches

**Component File Structure:**
```html
<template name="component-name">
  <!-- Template content -->
</template>

<style>
  /* Component styles */
</style>

<script type="module">
  // Component logic
</script>
```

#### 3.2 `processIncludes()`

**Description:** Automatically discovers and processes all `<wck-include>` elements in the document, loading the specified components and removing the include directives.

**Parameters:** None

**Returns:** Promise that resolves when all includes are processed

**Usage:**
```html
<wck-include src="./my-component.html"></wck-include>
<wck-include src="./ui-icon.component.html"></wck-include>
```

**Features:**
- Automatic execution on DOMContentLoaded
- Parallel loading of multiple components
- Removes include elements after loading
- Declarative component inclusion

#### 3.3 `componentsReady(...names)`

**Description:** Waits for custom elements to be defined before proceeding. Useful for ensuring components are ready before using them.

**Parameters:**
- `...names`: Custom element names to wait for

**Returns:** Promise that resolves when all elements are defined

**Usage:**
```javascript
await componentsReady('ui-icon', 'my-component');
```

**Features:**
- Multiple element support
- Debug logging
- Built on `customElements.whenDefined()`

---

### 4. DOM Utilities

#### 4.1 `parseToFragment(htmlString)`

**Description:** Parses an HTML string into a DocumentFragment, which can be efficiently inserted into the DOM.

**Parameters:**
- `htmlString`: HTML string to parse

**Returns:** DocumentFragment containing parsed elements

**Usage:**
```javascript
const fragment = parseToFragment('<div>Hello <span>World</span></div>');
document.body.appendChild(fragment);
```

**Features:**
- Efficient DOM creation
- Preserves element structure
- Used internally for component loading

#### 4.2 `fetchText(url)`

**Description:** Fetches text content from a URL with error handling and informative error messages.

**Parameters:**
- `url`: URL to fetch from

**Returns:** Promise resolving to text content

**Usage:**
```javascript
const html = await fetchText('./component.html');
```

**Features:**
- Async/await support
- Detailed error messages with status codes
- Used internally for component loading

#### 4.3 `updateIDs(element)`

**Description:** Prefixes all IDs within an element with "lucide-" namespace to avoid ID conflicts when including external SVG sprites.

**Parameters:**
- `element`: Element or DocumentFragment to update

**Returns:** The modified element

**Usage:**
```javascript
const fragment = parseToFragment(svgContent);
const namespaced = updateIDs(fragment);
```

**Features:**
- Prevents ID collisions
- Used for icon sprite loading
- Updates all descendant elements with IDs

---

### 5. Icon Component (`<ui-icon>`)

**Description:** A powerful web component for displaying SVG icons from the Lucide icon library. Automatically loads the icon sprite and provides a simple API for using icons.

#### Features

**Basic Usage:**
```html
<ui-icon name="home"></ui-icon>
<ui-icon name="search" size="32"></ui-icon>
<ui-icon name="settings" size="48" color="blue"></ui-icon>
```

**Attributes:**
- `name` (required): Icon name from Lucide library
- `size`: Icon size in pixels (default: 24)
- `color`: Icon color (default: currentColor)
- `stroke-width`: Stroke width (default: 2)
- `library`: Icon library (default: "lucide")
- `type`: Icon type (default: "filled")

**Advanced Features:**
- Automatic sprite loading from CDN
- CSS custom properties for styling
- Reactive attribute updates
- Template binding integration
- Observed attributes for dynamic updates
- SVG `<use>` tag for efficient rendering

**Styling:**
```css
ui-icon {
  --size: 32;
  --color: blue;
  --stroke-width: 1.5;
}
```

**Implementation:**
- Custom element: `UiIcon` class
- Uses template binding system
- Loads Lucide SVG sprite on initialization
- ID namespacing to prevent conflicts

---

### 6. Plugin Architecture

**Description:** The binding system is built on a flexible plugin architecture that allows for extensibility and clean separation of concerns.

#### Base Plugin Class

**Class:** `BindingPlugin`

**Methods:**
- `discover(root)`: Find elements with this binding type
- `initialize(element, instance)`: Set up binding metadata
- `update(element, instance, metadata)`: Update binding on data change
- `cleanup(element, metadata)`: Remove event listeners and references

#### Plugin Registry

**Variable:** `bindingPlugins` Map

**Registered Plugins:**
1. `interpolation` → `InterpolationPlugin`
2. `property` → `PropertyBindingPlugin`
3. `event` → `EventBindingPlugin`
4. `attribute` → `AttributeBindingPlugin`
5. `conditional` → `ConditionalRenderingPlugin`
6. `twoway` → `TwoWayBindingPlugin`
7. `list` → `ListRenderingPlugin`

**Features:**
- Extensible design
- Independent plugin operation
- Multiple plugins per element
- Phase-based execution (discover → initialize → update)

---

## Browser Requirements

- ES Modules support
- Web Components v1 specification
- CSS Nesting
- Async/Await
- Modern browser features (typically latest 2 versions)

---

## Design Philosophy

The Web Component Kit is designed for:
- **Rapid prototyping** without build tools
- **Zero configuration** - works directly in browser
- **Progressive enhancement** - use what you need
- **Familiar syntax** - Vue/Angular-inspired
- **Modern standards** - Web Components and ES modules

---

## Related Files

- `index.js` - Main library implementation
- `ui-icon.component.html` - Icon component implementation
- `README.md` - User-facing documentation
- `specs/design.md` - Architecture and design decisions
- `index.test.js` - Test suite
- `index.test.html` - Browser-based tests
- `ui-icon.test.html` - Icon component tests
