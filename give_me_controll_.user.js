// ==UserScript==
// @name           give me controll !!
// @namespace      http://d.hatena.ne.jp/janus_wel/
// @description    of the Vimperatorer, by the Vimperatorer, for the Vimperatorer
// @include        *
// ==/UserScript==

(function () {
abandonFocusElements('object');
abandonFocusElements('embed');

// stuff functions
function abandonFocusElements(elementName) {
    if (!elementName) return;
    var elements = document.getElementsByTagName(elementName);
    for (var i=0, max=elements.length ; i<max ; ++i) {
        abandonFocus(elements[i]);
    }
}

function abandonFocus(focusHolder) {
    if (!focusHolder) return;

    // for HTML 5
    // or HTMLEmbedElement (obsolete)
    if (focusHolder.blur) {
        focusHolder.addEventListener(
            'focus',
            function () {
                setTimeout(function () {
                    focusHolder.blur();
                }, 0);
            },
            false
        );
        return true;
    }

    // 'input' element has 'focus' and 'blur' method in DOM Level 2
    // refer: http://www.w3.org/TR/DOM-Level-2-HTML/html.html
    var helper;
    var straws = document.getElementsByTagName('input');
    for (var i=0, max=straws.length ; i<max ; ++i) {
        if (straws[i].type === 'hidden') {
            helper = straws[i];
            break;
        }
    }

    // if not found, append 'input' element to 'body'
    if (!helper) {
        helper = window.content.document.createElement('input');
        helper.type = 'hidden';
        helper.id = 'GM_give_me_controll';
        window.content.document.getElementsByTagName('body').item(0).appendChild(helper);
        GM_log('append');
    }

    focusHolder.addEventListener(
        'focus',
        function () {
            setTimeout(function () {
                helper.focus();
                helper.blur();
            }, 0);
        },
        false
    );
    return true;
}

})();

// vim: set sw=4 ts=4 et;
