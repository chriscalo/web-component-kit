# Web Component Kit - Design Document

## Project Goals

Build a reactive template binding system and web component toolkit for rapid HTML prototyping without build steps. Provide Vue/Angular-like declarative bindings with minimal overhead.

## Requirements

### Functional Requirements

1. **Template Binding System**
   - Text interpolation with `{{ expression }}`
   - Property binding with `.property="value"`
   - Event binding with `on:event="handler"`
   - Attribute binding with `[attr]="value"`
   - Conditional rendering with `@if="condition"`
   - List rendering with `@for="item in items"`
   - Two-way binding with `.value:input="model"`

2. **DOM Utilities**
   - Parse HTML strings to DocumentFragment
   - Update IDs with namespace prefix
   - Fetch text content from URLs

3. **Component Utilities**
   - Wait for custom elements to be defined
   - Load HTML component fragments dynamically

4. **Icon Component**
   - Render SVG icons from sprite sheet
   - Configurable size, color, and stroke width
   - Support for icon libraries

### Non-Functional Requirements

1. **Performance**
   - Use Vue's reactive system for efficient updates
   - Batch DOM updates where possible
   - Lazy load icon sprites

2. **Developer Experience**
   - Zero build step required
   - Works directly in browser
   - Clear error messages
   - Comprehensive examples

3. **Compatibility**
   - Modern browsers with ES modules support
   - Web Components v1 specification
   - CSS nesting support

## Architecture

### Template Binding System

The template binding system is built on a plugin architecture where each binding type is a separate plugin that extends the base `BindingPlugin` class.

#### Plugin Architecture

```javascript
class BindingPlugin {
  discover(root)        // Find bindable elements
  initialize(el, data)  // Set up initial bindings
  update(el, data, meta) // Update on data change
  cleanup(el, meta)     // Clean up resources
}
```

#### Binding Types

1. **InterpolationPlugin**: Handles `{{ expression }}` in text nodes
   - Walks text nodes to find interpolations
   - Splits text into static and dynamic parts
   - Updates text content on data changes

2. **PropertyBindingPlugin**: Handles `.property="value"`
   - Sets JavaScript properties directly
   - Preserves original values for restoration

3. **EventBindingPlugin**: Handles `on:event="handler"`
   - Attaches event listeners
   - Executes expressions in data context
   - Cleans up listeners on destroy

4. **AttributeBindingPlugin**: Handles `[attr]="value"`
   - Sets/removes HTML attributes
   - Handles null/false as removal

5. **ConditionalRenderingPlugin**: Handles `@if="condition"`
   - Replaces elements with comments when hidden
   - Recreates elements with bindings when shown
   - Manages nested bindings lifecycle

6. **ListRenderingPlugin**: Handles `@for="item in items"`
   - Clones template for each item
   - Creates scoped context with item and $index
   - Processes nested bindings per item

7. **TwoWayBindingPlugin**: Handles `.value:input="model"`
   - Combines property/attribute binding with events
   - Updates model on user input
   - Updates UI on model change

### Icon System

The icon system loads SVG sprites from CDN and renders icons through a Web Component.

#### Icon Loading Strategy

1. Fetch SVG sprite from Lucide CDN
2. Parse to DocumentFragment
3. Namespace IDs to avoid conflicts
4. Inject into document head
5. Reference icons via `<use>` element

#### Component Design

```html
<ui-icon name="home" size="24" color="blue"></ui-icon>
```

Renders as:
```html
<ui-icon>
  <svg viewBox="0 0 24 24">
    <use href="#lucide-home"></use>
  </svg>
</ui-icon>
```

### Component Loading

The `loadComponent()` function enables dynamic loading of HTML component files:

1. Fetch HTML content
2. Parse to DocumentFragment
3. Extract and inject `<template>` elements
4. Extract and inject `<style>` elements
5. Extract and execute `<script>` elements

This allows components to be defined in separate HTML files and loaded on demand.

## API Reference

### Core Functions

#### `bindTemplate(selector, instance)`
Binds a template to a data instance with reactive updates.

```javascript
const data = reactive({ count: 0 });
const render = bindTemplate("#my-template", container);
render(); // Initial render and start reactive updates
```

#### `loadComponent(url)`
Loads an HTML component file and injects its parts into the document.

```javascript
await loadComponent("./my-component.html");
```

#### `componentsReady(...names)`
Waits for custom elements to be defined.

```javascript
await componentsReady("ui-icon", "my-component");
```

### DOM Utilities

#### `parseToFragment(html)`
Parses HTML string to DocumentFragment.

#### `updateIDs(element)`
Prefixes all IDs with "lucide-" namespace.

#### `fetchText(url)`
Fetches text content from URL with error handling.

### Reactive Exports

The library re-exports Vue's reactivity functions:
- `reactive()` - Create reactive objects
- `effect()` - Create reactive effects

## Testing Strategy

### Unit Tests
- Test each binding plugin in isolation
- Test DOM utilities with various inputs
- Test component loading with mock responses

### Integration Tests
- Test complete templates with multiple bindings
- Test nested components and bindings
- Test dynamic component loading

### UI Tests
- Use Playwright for browser automation
- Extract test results from console
- Verify visual rendering of examples

## Usage Examples

### Basic Counter
```html
<template id="counter">
  <button on:click="count++">{{ count }}</button>
</template>

<script>
const data = reactive({ count: 0 });
bindTemplate("#counter", document.body)();
</script>
```

### Todo List
```html
<template id="todos">
  <ul>
    <li @for="todo in todos">
      <input type="checkbox" .checked="todo.done">
      {{ todo.text }}
    </li>
  </ul>
</template>
```

### Dynamic Styling
```html
<template id="styled">
  <div [class]="className" [style]="styles">
    Styled content
  </div>
</template>
```

## Future Enhancements

1. **Additional Directives**
   - `@show` for visibility without removing from DOM
   - `@model` for simplified two-way binding
   - `@once` for one-time bindings

2. **Performance Optimizations**
   - Virtual DOM diffing for list updates
   - Compiled templates for faster execution
   - Memoization of computed values

3. **Developer Tools**
   - Browser extension for debugging
   - Template validation
   - Performance profiling

## Open Questions

1. **Module Loading**: Should we support both ES modules and global scripts?
2. **Error Handling**: How verbose should error messages be in production?
3. **Browser Support**: Should we provide polyfills for older browsers?
4. **TypeScript**: Should we provide type definitions?

## References

- Vue 3 Reactivity: https://vuejs.org/guide/essentials/reactivity-fundamentals.html
- Web Components: https://developer.mozilla.org/en-US/docs/Web/Web_Components
- Lucide Icons: https://lucide.dev/