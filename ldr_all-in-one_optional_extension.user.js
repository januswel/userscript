// ==UserScript==
// @name           LDR all-in-one optional extension
// @namespace      http://d.hatena.ne.jp/janus_wel/
// @description    add optional, but usefull features to LDR / Fastladder
// @include        http://reader.livedoor.com/reader/*
// @include        http://fastladder.com/reader/*
// @version        0.11
// @author         janus_wel<janus.wel.3@gmail.com>
// ==/UserScript==

/*
 * Last Change: 2009/01/08 08:36:25.
 * ACKOWLEDGMENT
 * this script is based on:
 *  - http://d.hatena.ne.jp/reinyannyan/20060511/p1
 *  - http://d.hatena.ne.jp/antipop/20060430/1146343265
 *  - http://d.hatena.ne.jp/kusigahama/20071107
 */

( function () {

// configuration ---
// go to "t"op
// to avoid keybind confliction ( 'g' is used by LDR Full Feed )
const KEY_GOTO_TOP          = 't';
// go to "b"ottom
// to avoid keybind confliction ( 'G' is used by LDR Full Feed )
const KEY_GOTO_BOTTOM       = 'b';
// WARNING: rewrite default feature of key-bind "Z"
const KEY_TOGGLE_FULLSCREEN = 'Z';
// from ldr_relative_rate.user.js
const KEY_RAISE_RATING      = 'w';
const KEY_CUT_RATING        = 'q';


// main ---
// assumptions
const w = unsafeWindow || window;
with (w) {

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
// go to top of the current feed
function gotoTop() { Keybind.add(KEY_GOTO_TOP, Control.scroll_top); }

// go to bottom of the current feed
function gotoBottom() {
    Keybind.add(
        KEY_GOTO_BOTTOM,
        function () {
            var r = $('right_container');
            var actualStyle = document.defaultView.getComputedStyle(r, '');
            var visibleHeight = parseInt(actualStyle.height.replace(/px$/, ''), 10);
            var paddingHeight = $('scroll_padding').scrollHeight;
            var actualHeight = r.scrollHeight;
            var destinationHeight = actualHeight - visibleHeight - paddingHeight;
            if (destinationHeight > 0) Control.scroll_to_px(destinationHeight);
        }
    );
}

// toggle fullscreen
function toggleFullscreen() {
    Keybind.add(
        KEY_TOGGLE_FULLSCREEN,
        function () {
            function hideRightTopNavigator() {
                const rightTopNavigatorID = 'right_top_navi';
                Element.hide(rightTopNavigatorID);
                fit_screen()
            };

            // in defualt, this feature binded key "Z"
            State.fullscreen = State.show_left ? 1 : 0;
            Control.toggle_fullscreen();
            // in defualt, this feature binded key "z"
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
    Keybind.add(KEY_RAISE_RATING, function (){ vi[getRate() + 1](); });
    Keybind.add(
        KEY_CUT_RATING,
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
