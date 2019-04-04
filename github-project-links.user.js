// ==UserScript==
// @name        Github project links
// @version     1.0.1
// @description A userscript that adds a menu that shows a list of all the project links in the main menu.
// @author      80xer
// @namespace   https://github.com/80xer
// @match       https://github.com/*
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

  const userNav = $('#user-links');
  if (!userNav) return;
  // ul.header-search-wrapper
  // li.jump-to-suggestions-path
  GM_addStyle(`
    .prjsMenu { position: relative; }
    .prjsMenu:hover div.prjsWrap { display: block; }
    a.prjsLink { position: absolute; top: -10px; z-index: 2; }
    div.prjsWrap { position: absolute; width: 280px; z-index: 2; top: 8px; left: -10px; padding: 10px; display: none; }
    .tmpbefore { border-bottom-color: #343434; border: 8px solid transparent; }
    ul.prjs:before { position: absolute; left: 34px; top: -16px; content: ''; display: inline-block; }
    ul.prjs { position:relative; list-style: none; width: auto; }
    .tmpafter {  content: ''; }
    ul.prjs:after { position: absolute; left: 35px; top: -14px; content: ''; display: inline-block; margin-left: -9px; }
    ul.prjs li a { display: flex; padding: 10px 12px; text-decoration: none;}
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

  // create projects menu
  const menus = $('nav>ul');
  const menu = $('li:last-child', menus).cloneNode(true);
  addClass(menu, 'prjsMenu');

  const prjsLink = $('a', menu);
  prjsLink.textContent = 'Projects';
  prjsLink.setAttribute('href', '/orgs/lawcompany/projects');
  addClass(prjsLink, 'prjsLink');

  // open projects
  const openState = $('.table-list-header-toggle.states > a:first-child');
  const projects = $$('#projects-results h4 a');

  // set list in storage
  if (hasClass(openState, 'selected') && projects.length > 0) {
    GM_log('found open projects');

    const projectArray = projects.map(project => {
      GM_log(project);
      return {
        href: project.getAttribute('href'),
        name: project.textContent,
      };
    });
    GM_setValue('prjList', projectArray);
  } else {
    GM_log('not found open projects');
  }

  function setProjectList(projects) {
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
      anchor.textContent = project.name;
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
  }

  // get list in storage
  const prjList = GM_getValue('prjList');

  if (prjList && prjList.length > 0) {
    setProjectList(prjList);
    /*
    prjsLink.addEventListener('click', (e) => {
        e.preventDefault();
    }, false);
    */
  }

  menus.appendChild(menu);
})();
