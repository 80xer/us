// ==UserScript==
// @name        Github project links
// @version     1.3.4
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
  const darkStyle = $('.ghd-style');
  const menus = $$('nav a');

  GM_addStyle(`
    @media (max-width: 1011px) {
      .prjsMenu { height: 38px; width: 100%; }
      .prjsMenu .prjsWrap, .prjsMenu .reposWrap { top: -10px; left: 70px; }
      .prjsMenu ul.prjs:before { left: -7px; top: 12px; border-bottom-color: transparent; border-right-color: rgba(27,31,35,.15); }
      .prjsMenu ul.prjs:after { left: -5px; top: 13px; border-bottom-color: transparent; border-right-color: #fff;}
      .prjsMenu ul.prjs.dark:before { left: -7px; top: 12px; border-bottom-color: transparent; border-right-color: #343434; }
      .prjsMenu ul.prjs.dark:after { left: -5px; top: 13px; border-bottom-color: transparent; border-right-color: #181818;}
      a.prjsLink { z-index: 31; }
    }

    @media (min-width: 1012px) {
      a.prjsLink { z-index: 33; }
    }

    .prjsMenu { position: relative; }
    .prjsMenu:hover div.prjsWrap, .prjsMenu:hover div.reposWrap { display: block; }
    .prjsLink { display: block; width: 100%; }
    .prjsWrap, .reposWrap { position: absolute; width: 280px; z-index: 32; top: 35px; left: -10px; padding: 10px; display: none; }
    .tmpbefore { border-bottom-color: #343434; border: 8px solid transparent; }
    ul.lcul:before { position: absolute; left: 34px; top: -16px; content: ''; display: inline-block; }
    ul.lcul { position:relative; list-style: none; width: auto; }
    .tmpafter {  content: ''; }
    ul.lcul:after { position: absolute; left: 35px; top: -14px; content: ''; display: inline-block; margin-left: -9px; }
    ul.lcul li a { display: flex; flex-direction: column; padding: 10px 12px; text-decoration: none;}
    .jump-to-suggestions-path .pr-5 { padding-right: 0px !important; }
    input[type="checkbox"].chckRepo:focus, input[type="checkbox"].chckRepo:hover, input[type="checkbox"].chckRepo:active, input[type="checkbox"].chckRepo {
      position: absolute; top: 9px; left: -20px; width: 14px !important; height: 14px !important;
    }
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

  function createMenu(beforeMenu, fn) {
    if (!beforeMenu || beforeMenu.length < 1) {
      throw new Error(`not found '${beforeMenu.textContent}' menu`);
    }

    const newMenu = beforeMenu.cloneNode(true);

    let menu;
    if (fn) {
      menu = fn(newMenu);
    } else {
      menu = newMenu;
    }

    if (beforeMenu.nextSibling) {
      beforeMenu.parentNode.insertBefore(menu, beforeMenu.nextSibling);
    } else {
      beforeMenu.parentNode.appendChild(menu);
    }
    return menu;
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
    if (!projects || projects.length <= 0) {
      return;
    }

    const prjsWrap = document.createElement('div');
    addClass(prjsWrap, 'prjsWrap');
    const prjs = document.createElement('ul');
    addClass(prjs, 'lcul');
    addClass(prjs, 'Box');
    addClass(prjs, 'Popover-message');
    addClass(prjs, 'jump-to-suggestions');
    addClass(prjs, 'jump-to-suggestions-results-container');
    if (darkStyle) addClass(prjs, 'dark');

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
  }

  const parentProjectMenu = (text, url) => menu => {
    const parentMenu = document.createElement('div');
    addClass(parentMenu, 'prjsMenu');
    addClass(menu, 'prjsLink');
    menu.textContent = text;
    menu.setAttribute('href', url);
    parentMenu.appendChild(menu);
    return parentMenu;
  };

  const parentRepositoryMenu = (text, url) => menu => {
    const link = $('a', menu);
    link.textContent = text;
    link.setAttribute('href', url);
    return menu;
  };

  const beforeMenu = menus.filter(e => e.textContent.trim() === 'Explore')[0];

  const projectMenu = createMenu(
    beforeMenu,
    parentProjectMenu('Projects', '/orgs/lawcompany/projects')
  );

  const repositoryMenu = createMenu(
    projectMenu,
    parentRepositoryMenu('Repositories', '/lawcompany')
  );

  function setCheckRepository(repoList) {
    const repos = $$('#org-repositories .org-repos.repo-list ul li');
    if (!repos || repos.length <= 0) return;
    repos.forEach(repo => {
      const h3 = $('h3', repo);
      const anchor = $('a', h3);
      h3.style.position = 'relative';
      const ch = document.createElement('input');
      ch.setAttribute('type', 'checkbox');
      ch.setAttribute('data-text', anchor.textContent.trim());
      ch.setAttribute('data-url', anchor.getAttribute('href'));
      const checkedRepo = repoList.filter(
        repo => anchor.textContent.trim() === repo.text
      );
      if (checkedRepo.length > 0) ch.setAttribute('checked', true);
      addClass(ch, 'chckRepo');
      h3.appendChild(ch);
      ch.addEventListener(
        'change',
        e => {
          let repoList = GM_getValue('repoList', []);
          if (e.target.checked) {
            repoList.push({
              text: e.target.getAttribute('data-text'),
              url: e.target.getAttribute('data-url'),
            });
          } else {
            repoList = repoList.filter(
              repo => repo.text !== e.target.getAttribute('data-text')
            );
          }
          GM_setValue('repoList', repoList);
          createRepositoryList(repositoryMenu, repoList);
        },
        false
      );
    });
  }

  function createRepositoryList(menu, repos) {
    if (!repos || repos.length <= 0) {
      return;
    }

    const reposWrap = document.createElement('div');
    addClass(reposWrap, 'reposWrap');
    const rps = document.createElement('ul');
    addClass(rps, 'lcul');
    addClass(rps, 'Box');
    addClass(rps, 'Popover-message');
    addClass(rps, 'jump-to-suggestions');
    addClass(rps, 'jump-to-suggestions-results-container');
    if (darkStyle) addClass(rps, 'dark');

    repos.sort((a, b) => {
      if (a.text < b.text) return -1;
      return 1;
    });

    repos.forEach(repo => {
      const rp = document.createElement('li');
      addClass(rp, 'navigation-item');
      const anchor = document.createElement('a');
      addClass(anchor, 'jump-to-suggestions-path');
      anchor.setAttribute('href', repo.url);
      const name = document.createElement('div');
      name.textContent = repo.text;
      anchor.appendChild(name);
      rp.appendChild(anchor);
      rp.onmouseenter = function(e) {
        e.target.setAttribute('aria-selected', true);
      };
      rp.onmouseleave = function(e) {
        e.target.setAttribute('aria-selected', false);
      };
      rps.appendChild(rp);
    });

    reposWrap.appendChild(rps);
    if ($('.reposWrap', menu)) {
      menu.removeChild($('.reposWrap'));
    }
    menu.appendChild(reposWrap);
  }

  const repoList = GM_getValue('repoList', []);
  setCheckRepository(repoList);

  const prjList = getProjectListToStorage();
  createProjectList(projectMenu, prjList);
  createRepositoryList(repositoryMenu, repoList);

  GM_log(`>>> OK`);
})();
