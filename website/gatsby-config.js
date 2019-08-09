/* eslint-disable @typescript-eslint/camelcase,@typescript-eslint/no-var-requires*/
const express = require('express');
const path = require('path');
const pkg = require('../package.json');

module.exports = {
  siteMetadata: {
    title: `${pkg.name}: ${pkg.description}`,
    author: pkg.author
  },
  developMiddleware: app => {
    ['/api', '/otplib-browser'].forEach(val => {
      app.use(val, express.static(path.join('public', val)));
    });
  },
  plugins: [
    `gatsby-transformer-json`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `${__dirname}/src/pages`
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `package`,
        path: `${__dirname}/..`,
        ignore: [`**/.*`, `node_modules/**/*`, `**/*`, `!*.md`]
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `configs`,
        path: `${__dirname}/../configs`
      }
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: [`.mdx`, `.md`],
        defaultLayouts: {
          default: path.resolve(`./src/components/Layout.jsx`)
        }
      }
    },
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`
      }
    }
  ]
};
