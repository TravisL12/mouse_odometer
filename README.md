# Webpack Simple Boilerplate
This boilerplate sets up a development environment in `node.js`, `es6`, and `sass` as well as produces a browser-ready application.

If you experience any issues, please [report](https://github.com/JazzBrotha/webpack-simple-boilerplate/issues/new).

## Instructions

* Clone this repository.

* Install all dependencies for your project:

```bash
npm install
```

* For development:

```bash
npm run dev
```
* For production:

```bash
npm run build
```

## App set up

* `dist` - Production folder. One root file in `index.html` linked to your entire app in form of `bundle.min.js`.
* `src` - Development folder.
    - `index.ejs` - Write all your html here.
    - `js` - All unconverted `js`-files.
    - `scss` - All unconverted `scss`-files.
* `webpack.config.babel.js` - Your app's config file. More instructions of the set up in here.
* `package.json` - All the dependencies for the project listed.
* `.babelrc` - Babel set up. This file can be expanded to fit your needs.
