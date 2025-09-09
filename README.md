# @chriscalo/web-component-kit

A reactive template binding system and web component toolkit for rapid HTML prototyping. Zero build steps, just drop it in and start building reactive UIs with Vue-like syntax.

## Features

- 🚀 **Zero build step** - Works directly in the browser
- ⚡ **Reactive bindings** - Powered by Vue 3's reactivity system
- 🎯 **Declarative syntax** - Vue/Angular-inspired template bindings
- 🧩 **Web Components** - Build reusable custom elements
- 📦 **Component loading** - Include HTML components with `<wck-include>`
- 🎨 **Icon system** - Beautiful Lucide icons out of the box

## Installation

### CDN (Recommended for prototyping)

```html
<script type="module">
  import { bindTemplate, reactive } from "https://cdn.jsdelivr.net/gh/chriscalo/web-component-kit@v1.0.0/index.js";
</script>
```

### NPM

```bash
npm install @chriscalo/web-component-kit
```

```javascript
import { bindTemplate, reactive } from "@chriscalo/web-component-kit";
```

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Define a template -->
  <template id="my-app-template">
    <div>
      <h1>{{ data.title }}</h1>
      <button on:click="data.count++">
        Clicked {{ data.count }} times
      </button>
      <input .value="data.name" on:input="data.name = event.target.value">
      <p @if="data.name">Hello, {{ data.name }}!</p>
    </div>
  </template>

  <!-- Use the custom element -->
  <my-app></my-app>

  <!-- Define the web component -->
  <script type="module">
    import { bindTemplate, reactive } from "@chriscalo/web-component-kit";
    
    class MyApp extends HTMLElement {
      connectedCallback() {
        this.data = reactive({
          title: "My Reactive App",
          count: 0,
          name: ""
        });
        
        const render = bindTemplate("#my-app-template", this);
        render();
      }
    }
    
    customElements.define("my-app", MyApp);
  </script>
</body>
</html>
```

## Template Bindings

### Text Interpolation

```html
<span>{{ message }}</span>
<p>Count: {{ count * 2 }}</p>
```

### Property Binding

```html
<input .value="inputText">
<button .disabled="isLoading">Submit</button>
```

### Event Binding

```html
<button on:click="handleClick()">Click me</button>
<input on:input="updateValue(event)">
<form on:submit="handleSubmit(event)">
```

### Attribute Binding

```html
<div [class]="dynamicClass"></div>
<img [src]="imageUrl">
<button [title]="tooltipText">Hover me</button>
```

### Conditional Rendering

```html
<div @if="isVisible">Conditionally shown</div>
<p @if="count > 10">Count is greater than 10</p>
```

### List Rendering

```html
<ul>
  <li @for="item in items">
    {{ item.name }} - ${{ item.price }}
  </li>
</ul>
```

### Two-way Binding

```html
<input .value:input="searchQuery">
<select .value:change="selectedOption">
```

## Component Loading

Include HTML component files using the `<wck-include>` directive:

```html
<!-- main.html -->
<wck-include src="./my-component.html"></wck-include>
<wck-include src="./ui-icon.component.html"></wck-include>
```

Components are automatically loaded and injected into the document.

## Icon Component

The kit includes a powerful icon component using Lucide icons:

```html
<!-- Include the icon component -->
<wck-include src="node_modules/@chriscalo/web-component-kit/ui-icon.component.html"></wck-include>

<!-- Use icons -->
<ui-icon name="home"></ui-icon>
<ui-icon name="search" size="32" color="blue"></ui-icon>
<ui-icon name="settings" size="48" stroke-width="1"></ui-icon>
```

## API Reference

### Core Functions

#### `bindTemplate(selector, instance)`

Binds a template to a DOM element with reactive data. The second parameter serves as both the binding context (containing the data) and the container (where template content is appended).

```javascript
// In a web component
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.data = reactive({ count: 0 });
    const render = bindTemplate("#my-template", this);
    render(); // Start reactive updates
  }
}

customElements.define("my-component", MyComponent);
```

#### `reactive(object)`

Creates a reactive object (from Vue 3).

```javascript
const state = reactive({
  count: 0,
  items: []
});
```

#### `loadComponent(url)`

Loads an HTML component file.

```javascript
await loadComponent("./my-component.html");
```

#### `processIncludes()`

Processes all `<wck-include>` elements in the document.

```javascript
await processIncludes();
```

#### `componentsReady(...names)`

Waits for custom elements to be defined.

```javascript
await componentsReady("ui-icon", "my-component");
```

### DOM Utilities

#### `parseToFragment(html)`

Parses HTML string to DocumentFragment.

```javascript
const fragment = parseToFragment("<div>Hello</div>");
```

#### `fetchText(url)`

Fetches text content from a URL.

```javascript
const html = await fetchText("./component.html");
```

## Creating Components

Create reusable components in separate HTML files:

```html
<!-- my-counter.component.html -->
<template name="my-counter">
  <div class="counter">
    <button on:click="data.count--">-</button>
    <span>{{ data.count }}</span>
    <button on:click="data.count++">+</button>
  </div>
</template>

<style>
  .counter {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
</style>

<script type="module">
  import { bindTemplate, reactive } from "@chriscalo/web-component-kit";
  
  class MyCounter extends HTMLElement {
    connectedCallback() {
      this.data = reactive({ count: 0 });
      const template = document.querySelector(`template[name="my-counter"]`);
      const render = bindTemplate(template, this);
      render();
    }
  }
  
  customElements.define("my-counter", MyCounter);
</script>
```

Use it in your app:

```html
<wck-include src="./my-counter.component.html"></wck-include>
<my-counter></my-counter>
```

## Examples

Check out the [examples.html](examples.html) file for comprehensive demos:

- Counter with interpolation
- Two-way data binding
- Todo list with @for
- Dynamic styling
- Icon gallery
- Form validation

Run the examples:

```bash
npm start
# Open http://localhost:3000/examples.html
```

## Testing

Run the test suite:

```bash
npm test
```

View tests in browser:

```bash
npm start
# Open http://localhost:3000/index.test.html
# Open http://localhost:3000/ui-icon.test.html
```

## Browser Support

Requires modern browsers with:
- ES Modules
- Web Components v1
- CSS Nesting
- Async/Await

## License

MIT

## Contributing

Contributions are welcome! Please read the [design document](specs/design.md) for architecture details.

## Philosophy

This kit is designed for **quick and dirty HTML prototyping**. It's not meant for production applications but for rapid experimentation where you want to:

- Test ideas quickly in the browser
- Avoid build tools and complex setups
- Get immediate feedback
- Focus on prototyping, not tooling

## Similar Projects

- [Alpine.js](https://alpinejs.dev/) - Minimal framework for HTML
- [Lit](https://lit.dev/) - Simple web components
- [Petite Vue](https://github.com/vuejs/petite-vue) - Subset of Vue for progressive enhancement