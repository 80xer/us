// ==UserScript==
// @name        Github project links
// @version     1.2
// @description A userscript that adds a menu that shows a list of all the project links in the main menu.
// @author      80xer
// @namespace   https://github.com/80xer
// @match       https://github.com/*
// @run-at      document-end
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_log
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/80xer/us/master/github-project-links.user.js
// @downloadURL https://raw.githubusercontent.com/80xer/us/master/github-project-links.user.js
// ==/UserScript==

(function() {
  'use strict';
  const user = $('.Header-item .avatar');
  if (!user) {
    GM_log('not found user avatar');
    return;
  }

  GM_addStyle(`
    .prjsMenu { position: relative; }
    .prjsMenu:hover div.prjsWrap { display: block; }
    a.prjsLink { position: absolute; z-index: 33; }
    div.prjsWrap { position: absolute; width: 280px; z-index: 32; top: 20px; left: -10px; padding: 10px; display: none; }
    .tmpbefore { border-bottom-color: #343434; border: 8px solid transparent; }
    ul.prjs:before { position: absolute; left: 34px; top: -16px; content: ''; display: inline-block; }
    ul.prjs { position:relative; list-style: none; width: auto; }
    .tmpafter {  content: ''; }
    ul.prjs:after { position: absolute; left: 35px; top: -14px; content: ''; display: inline-block; margin-left: -9px; }
    ul.prjs li a { display: flex; flex-direction: column; padding: 10px 12px; text-decoration: none;}
    .jump-to-suggestions-path .pr-5 { padding-right: 0px !important; }
  `);

  function $(str, el) {
    return (el || document).querySelector(str);
  }

  function $$(str, el) {
    return Array.from((el || document).querySelectorAll(str));
  }

  function hasClass(el, className) {
    if (!el) return false;
    if (el.classList) return el.classList.contains(className);
    else
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
  }

  function addClass(el, className) {
    if (!el) return;
    if (el.classList) el.classList.add(className);
    else el.className += ' ' + className;
  }

  function createMenu() {
    return new Promise((resolve, reject) => {
      const menus = $$('nav a');
      const explore = menus.filter(e => e.textContent.trim() === 'Explore')[0];

      if (!explore || explore.length < 1) {
        reject({ msg: 'not found explore menu' });
      }

      const menu = document.createElement('div');
      addClass(menu, 'prjsMenu');

      const prjsLink = explore.cloneNode(true);
      prjsLink.textContent = 'Projects';
      prjsLink.setAttribute('href', '/orgs/lawcompany/projects');
      addClass(prjsLink, 'prjsLink');
      menu.appendChild(prjsLink);
      explore.parentNode.appendChild(menu);
      resolve(menu);
    });
  }

  function getProjectListToStorage() {
    // open projects
    const openState = $('.table-list-header-toggle.states > a:first-child');
    const projects = $$('#projects-results > div');
    // set list in storage
    if (hasClass(openState, 'selected') && projects.length > 0) {
      const projectArray = projects.map(project => {
        const info = project.children[1];
        const anchor = $('h4 a', info);
        let bar;
        if (info.children.length >= 3) {
          bar = info.children[2].cloneNode(true).outerHTML;
        }
        return {
          href: anchor.getAttribute('href'),
          name: anchor.textContent,
          bar: bar,
        };
      });
      GM_setValue('prjList', projectArray);
    }
    return GM_getValue('prjList');
  }

  function createProjectList(menu, projects) {
    return new Promise((resolve, reject) => {
      if (projects || projects.length <= 0) {
        resolve();
      }

      const prjsWrap = document.createElement('div');
      addClass(prjsWrap, 'prjsWrap');
      const prjs = document.createElement('ul');
      addClass(prjs, 'prjs');
      addClass(prjs, 'Box');
      addClass(prjs, 'Popover-message');
      addClass(prjs, 'jump-to-suggestions');
      addClass(prjs, 'jump-to-suggestions-results-container');

      projects.forEach(project => {
        const prj = document.createElement('li');
        addClass(prj, 'navigation-item');
        const anchor = document.createElement('a');
        addClass(anchor, 'jump-to-suggestions-path');
        anchor.setAttribute('href', project.href);
        const name = document.createElement('div');
        name.textContent = project.name;
        anchor.appendChild(name);
        if (project.bar) {
          const bar = document.createElement(null);
          anchor.appendChild(bar);
          bar.outerHTML = project.bar;
        }
        prj.appendChild(anchor);
        prj.onmouseenter = function(e) {
          e.target.setAttribute('aria-selected', true);
        };
        prj.onmouseleave = function(e) {
          e.target.setAttribute('aria-selected', false);
        };
        prjs.appendChild(prj);
      });

      prjsWrap.appendChild(prjs);
      menu.appendChild(prjsWrap);
      resolve();
    });
  }

  createMenu()
    .then(menu => {
      const prjList = getProjectListToStorage();
      return createProjectList(menu, prjList);
    })
    .then(() => {
      GM_log(`>>> OK`);
    })
    .catch(e => {
      GM_log(e);
      GM_log(`>>> ERR : ${e.msg}`);
    });
})();
