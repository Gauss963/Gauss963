# Article Templates

Use the site frame from `Articles.html`, then choose one template CSS.

## Shared Base

Every article page should load:

```html
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="article-base.css" />
```

Body should always include:

```html
<body class="article-page no-cover template-prose">
```

Replace `template-prose` with the template you need.

## Templates

### 1. `article-template-prose.css`

Use for essays, reflections, translations, and long-form writing.

Recommended body class:

```html
<body class="article-page no-cover template-prose">
```

Current examples:
- `Article-1.html`
- `Article-2.html`
- `Article-3.html`
- `Article-5.html`
- `Article-9.html`
- `Article-10.html`
- `Article-11.html`
- `Article-12.html`
- `Article-13.html`
- `Article-14.html`
- `Article-16.html`
- `Article-17.html`
- `Article-18.html`
- `Article-19.html`
- `Article-20.html`
- `Article-21.html`
- `Article-22.html`

### 2. `article-template-note.css`

Use for short academic updates, acceptance notes, and structured metadata pages.

Recommended body class:

```html
<body class="article-page no-cover template-note">
```

Current example:
- `Article-8.html`

### 3. `article-template-ranking.css`

Use for ranked lists, media picks, and repeated card-style sections.

Recommended body class:

```html
<body class="article-page no-cover template-ranking">
```

Current examples:
- `Article-7.html`
- `Article-15.html`

### 4. `article-template-links.css`

Use for archive-style pages that mostly list links to related pages.

Recommended body class:

```html
<body class="article-page no-cover template-links">
```

Current examples:
- `Article-4.html`
- `Article-6.html`

## Suggested Head Snippets

### Prose

```html
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="article-base.css" />
<link rel="stylesheet" href="article-template-prose.css" />
```

### Note

```html
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="article-base.css" />
<link rel="stylesheet" href="article-template-note.css" />
```

### Ranking

```html
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="article-base.css" />
<link rel="stylesheet" href="article-template-ranking.css" />
```

### Links

```html
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="article-base.css" />
<link rel="stylesheet" href="article-template-links.css" />
```
