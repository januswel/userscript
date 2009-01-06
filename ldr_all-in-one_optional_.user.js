// ==UserScript==
// @name           LDR all-in-one optional extension
// @namespace      http://d.hatena.ne.jp/janus_wel/
// @description    add optional, but usefull features to LDR / Fastladder
// @include        http://reader.livedoor.com/reader/*
// @include        http://fastladder.com/reader/*
// @version        0.10
// @author         janus_wel<janus.wel.3@gmail.com>
// ==/UserScript==

/*
based on:
    http://d.hatena.ne.jp/reinyannyan/20060511/p1
    http://d.hatena.ne.jp/antipop/20060430/1146343265
    http://d.hatena.ne.jp/kusigahama/20071107
*/

( function () {

// assumptions
const w = unsafeWindow || window;
with (w) {

// main ---
window.addEventListener(
    'load',
    function () {
        gotoTop();
        gotoBottom();
        toggleFullscreen();
        changeRatingRelatively();
    },
    false
);

// stuff ---
// go to "t"op
// to avoid keybind confliction ( 'g' is used by LDR Full Feed )
function gotoTop() { Keybind.add('t', Control.scroll_top); }

// go to "b"ottom
// to avoid keybind confliction ( 'G' is used by LDR Full Feed )
function gotoBottom() {
    Keybind.add(
        'b',
        function () {
            Control.scroll_to_px($('right_container').scrollHeight);
        }
    );
}

// toggle fullscreen
// WARNING: rewrite default feature of key-bind 'Z'
function toggleFullscreen() {
    Keybind.add(
        'Z',
        function () {
            function hideRightTopNavigator() {
                const rightTopNavigatorID = 'right_top_navi';
                Element.hide(rightTopNavigatorID);
                fit_screen()
            };

            // defualt keybind 'Z'
            State.fullscreen = State.show_left ? 1 : 0;
            Control.toggle_fullscreen();
            // default keybind 'z'
            Control.toggle_leftpane();
            hideRightTopNavigator();
        }
    );
}

// from ldr_relative_rate.user.js
function changeRatingRelatively() {
    function getRate() {
        var imageURL = $('rate_img').src;
        if (imageURL && imageURL.match(/(\d)\.gif$/)) return parseInt(RegExp.$1, 10);
        return;
    }
    Keybind.add('w', function (){ vi[getRate() + 1](); });
    Keybind.add(
        'q',
        function () {
            var rate = getRate();
            rate === 0
                ? Control.unsubscribe()
                : vi[rate - 1]();
        }
    );
}

} // with (w)
} )();

// vim: sw=4 sts=4 ts=4 et
