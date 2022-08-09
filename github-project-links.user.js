// ==UserScript==
// @name        Github repository links
// @version     1.4
// @description A userscript that adds a menu that shows a list of selected repository links in org. lawcompany.
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

let utilityFunc = () => {
  const repoListUrl = () => {
    let orgName = GM_getValue("orgName", undefined);
    if (!orgName) {
      orgName = window.prompt("enter org name");
      GM_setValue("orgName", orgName);
    }
    return `/orgs/${orgName}/repositories`;
  };
  const DELETE_HTML = `<span class="tooltipped tooltipped-s" aria-label="Two-factor security not enabled" label="Two-factor security not enabled"><svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-x">
  <path fill-rule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
</svg></span>`;
  var run = () => {
    "use strict";
    const user = $(".Header-item .avatar");
    if (!user) {
      GM_log("not found user avatar");
      return;
    }
    const darkStyle = $(".ghd-style");
    const menus = $$("nav a");

    GM_addStyle(`
  @media (max-width: 1011px) {
    .repoMenu { height: 38px; width: 100%; }
    .repoMenu .prjsWrap, .repoMenu .reposWrap { top: -10px; left: 70px; }
    .repoMenu ul.prjs:before { left: -7px; top: 12px; border-bottom-color: transparent; border-right-color: rgba(27,31,35,.15); }
    .repoMenu ul.prjs:after { left: -5px; top: 13px; border-bottom-color: transparent; border-right-color: #fff;}
    .repoMenu ul.prjs.dark:before { left: -7px; top: 12px; border-bottom-color: transparent; border-right-color: #343434; }
    .repoMenu ul.prjs.dark:after { left: -5px; top: 13px; border-bottom-color: transparent; border-right-color: #181818;}
    a.repoLink { z-index: 31; }
  }

  @media (min-width: 1012px) {
    a.repoLink { z-index: 33; }
  }

  .repoMenu { position: relative; }
  .repoMenu:hover div.prjsWrap, .repoMenu:hover div.reposWrap { display: block; }
  .repoLink { display: block; width: 100%; }
  .prjsWrap, .reposWrap { position: absolute; width: 280px; z-index: 132; top: 35px; left: -10px; padding: 10px; display: none; }
  .tmpbefore { border-bottom-color: #343434; border: 8px solid transparent; }
  ul.lcul:before { position: absolute; left: 34px; top: -16px; content: ''; display: inline-block; }
  ul.lcul { position:relative; list-style: none; width: auto; }
  .tmpafter {  content: ''; }
  ul.lcul:after { position: absolute; left: 35px; top: -14px; content: ''; display: inline-block; margin-left: -9px; }
  ul.lcul li a { display: flex; flex-direction: row; padding: 10px 12px; text-decoration: none; justify-content: space-between; }
  .jump-to-suggestions-path .pr-5 { padding-right: 0px !important; }
  .navigation-item button { border: none; }
  .navigation-item button:hover { background-color: #f50; }
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
      else {
        return new RegExp("(^| )" + className + "( |$)", "gi").test(
          el.className
        );
      }
    }

    function addClass(el, className) {
      if (!el) return;
      if (el.classList) el.classList.add(className);
      else el.className += " " + className;
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

    const parentRepositoryMenu = (text, url) => (menu) => {
      let parentMenu = document.querySelector(".repoMenu");
      if (!parentMenu) {
        parentMenu = document.createElement("div");
        addClass(parentMenu, "repoMenu");
        addClass(menu, "repoLink");
        menu.textContent = text;
        menu.setAttribute("href", url);
        parentMenu.appendChild(menu);
      }
      return parentMenu;
    };

    const beforeMenu = menus.filter(
      (e) => e.textContent.trim() === "Explore"
    )[0];

    const repositoryMenu = createMenu(
      beforeMenu,
      parentRepositoryMenu("Repositories", repoListUrl())
    );

    function setCheckRepository(repoList) {
      const { pathname } = window.location;
      if (pathname !== repoListUrl()) return;
      const repos = $$("#org-repositories .org-repos.repo-list ul li");
      if (!repos || repos.length <= 0) return;
      repos.forEach((repo) => {
        const h3 = $("h3", repo);
        const anchor = $("a", h3);
        h3.style.position = "relative";
        const alreadyCh = $(".chckRepo", h3);
        if (alreadyCh) h3.removeChild(alreadyCh);
        const ch = document.createElement("input");
        ch.setAttribute("type", "checkbox");
        ch.setAttribute("data-text", anchor.textContent.trim());
        ch.setAttribute("data-url", anchor.getAttribute("href"));
        const checkedRepo = repoList.filter(
          (repo) => anchor.textContent.trim() === repo.text
        );
        if (checkedRepo.length > 0) ch.setAttribute("checked", true);
        addClass(ch, "chckRepo");
        ch.addEventListener(
          "change",
          (e) => {
            let repoList = GM_getValue("repoList", []);
            if (e.target.checked) {
              repoList.push({
                text: e.target.getAttribute("data-text"),
                url: e.target.getAttribute("data-url"),
              });
            } else {
              repoList = repoList.filter(
                (repo) => repo.text !== e.target.getAttribute("data-text")
              );
            }
            GM_setValue("repoList", repoList);
            createRepositoryList(repositoryMenu, repoList);
          },
          false
        );
        //                h3.appendChild(ch);
        h3.insertAdjacentElement("afterbegin", ch);
      });
    }

    function createRepositoryList(menu, repos) {
      if (!repos || repos.length <= 0) {
        return;
      }

      const reposWrap = document.createElement("div");
      addClass(reposWrap, "reposWrap");
      const rps = document.createElement("ul");
      addClass(rps, "lcul");
      addClass(rps, "Box");
      addClass(rps, "Popover-message");
      addClass(rps, "jump-to-suggestions");
      addClass(rps, "jump-to-suggestions-results-container");
      if (darkStyle) addClass(rps, "dark");

      repos.sort((a, b) => {
        if (a.text < b.text) return -1;
        return 1;
      });

      repos.forEach((repo) => {
        const rp = document.createElement("li");
        addClass(rp, "navigation-item");
        const anchor = document.createElement("a");
        addClass(anchor, "jump-to-suggestions-path");
        anchor.setAttribute("href", repo.url);
        const name = document.createElement("div");
        name.textContent = repo.text;
        anchor.appendChild(name);
        const btnDelete = document.createElement("button");
        const deleteRepo = (text) => (e) => {
          e.preventDefault();
          let repoList = GM_getValue("repoList", []);
          GM_log("data-text:", text);
          repoList = repoList.filter((r) => {
            GM_log("r.text:", r.text);
            return r.text !== text;
          });
          GM_log(repoList);
          GM_setValue("repoList", repoList);
          setCheckRepository(repoList);
          rps.removeChild(rp);
        };
        btnDelete.addEventListener("click", deleteRepo(repo.text));
        btnDelete.insertAdjacentHTML("beforeend", DELETE_HTML);
        anchor.appendChild(btnDelete);
        rp.appendChild(anchor);
        rp.onmouseenter = function (e) {
          e.target.setAttribute("aria-selected", true);
        };
        rp.onmouseleave = function (e) {
          e.target.setAttribute("aria-selected", false);
        };

        rps.appendChild(rp);
      });

      reposWrap.appendChild(rps);
      if ($(".reposWrap", menu)) {
        menu.removeChild($(".reposWrap"));
      }
      menu.appendChild(reposWrap);
    }

    const repoList = GM_getValue("repoList", []);
    setCheckRepository(repoList);
    createRepositoryList(repositoryMenu, repoList);
  };

  var pS = window.history.pushState;
  var rS = window.history.replaceState;

  window.history.pushState = function (a, b, url) {
    run(url);
    pS.apply(this, arguments);
  };

  window.history.replaceState = function (a, b, url) {
    run(url);
    rS.apply(this, arguments);
  };
};
utilityFunc();
