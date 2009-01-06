// ==UserScript==
// @name           LDR all-in-one Hatena extension
// @namespace      http://d.hatena.ne.jp/janus_wel/
// @description    add various features with services provided by Hatena, to LDR / Fastladder
// @include        http://reader.livedoor.com/reader/*
// @include        http://fastladder.com/reader/*
// @version        0.11
// @author         janus_wel<janus.wel.3@gmail.com>
// ==/UserScript==

/*
 * Last Change: 2009/01/07 00:15:15.
 *
 * ACKNOWLEDGMENT
 * this script is based on:
 *  - http://la.ma.la/blog/diary_200610182325.htm
 *  - http://la.ma.la/blog/diary_200707121316.htm
 *  - http://d.hatena.ne.jp/KGA/20070908/1189223454
 *  - http://michilu.com/blog/posts/123/
 *  - http://zeromemory.sblo.jp/article/1230111.html
*/

( function () {

// main ---
window.addEventListener(
    'load',
    function () {
        sumofHatenaBookmark();
        numofHatenaBookmark();
        sumofHatenaStar();
    },
    false
);

// assumption
const w = unsafeWindow || window;
with (w) {

// display the sum of bookmarked on the feed by はてなブックマーク
function sumofHatenaBookmark() {
    channel_widgets.add(
        'sum_of_HatenaBookmark',
        function (feed) {
            var hbURL = 'http://b.hatena.ne.jp/entrylist?url=' + feed.channel.link;
            var hbCounter = 'http://b.hatena.ne.jp/bc/' + feed.channel.link;

            return <a href={hbURL}>
                <img style="vertical-align:middle; border:none;" src={hbCounter} />
            </a>;
        },
        'the sum of bookmarked on the feed by はてなブックマーク'
    );
}


// display the number of bookmarked on the entry by はてなブックマーク
function numofHatenaBookmark() {
    entry_widgets.add(
        'number_of_HatenaBookmark',
        function (feed, item) {
            var link = item.link.replace(/#/g,'%23');
            var hbURL = 'http://b.hatena.ne.jp/entry/' + link;
            var hbCounter = 'http://b.hatena.ne.jp/entry/image/' + link;

            return <a href={hbURL}>
                <img src="http://d.hatena.ne.jp/images/b_entry.gif" style="border:none;" />
                <img style="border:none; margin-left:3px;" src={hbCounter} />
            </a>;
        },
        'the number of bookmarked on the entry by はてなブックマーク'
    );
}


// display the sum of はてなスター on the feed
// TODO cache sum of はてなスター to DOM storage
function sumofHatenaStar() {
    // at first, invisible
    // refer: http://d.hatena.ne.jp/brazil/20060820/1156056851
    GM_addStyle(<><![CDATA[
        span.widget_sum_of_HatenaStar {
            display:     none;
            color:       #f4b128;
            font-weight: bold;
        }
    ]]></>);

    channel_widgets.add(
        'sum_of_HatenaStar',
        function (feed) {
            var hsURL = 'http://s.hatena.ne.jp/blog.json/' + feed.channel.link;
            var hsId = 'hs-' + feed.subscribe_id;

            // get wrapped function and run immediately
            wrapSecurely(function () {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    hsURL,
                    onload: function (r) {
                        // nothing to do
                        if (r.status !== 200) return;

                        var s = evalManually(r.responseText);
                        var t = setInterval( function () {
                            var node = $(hsId);
                            if (node) {
                                clearInterval(t);
                                node.textContent = s.star_count;
                                node.parentNode.style.display = 'inline';
                            }
                        }, 100);
                    },
                });
            })();

            return <>
                <img style="border:none;" src="http://s.hatena.ne.jp/images/star.gif" />
                <span id={hsId}>-</span>
            </>;
        },
        'the sum of はてなスター on the feed'
    );
}


// display and add はてなスター to entry.
/* not work
includeHatenaStar();
var t = setInterval(
    function() {
        if (Hatena) {
            clearInterval(t);
            initHatenaStar();
        }
    },
    100
);

function includeHatenaStar() {
    var s = document.createElement('script');
    s.src = 'http://s.hatena.ne.jp/js/HatenaStar.js';
    s.charset = 'utf-8';
    document.body.appendChild(s);
};

function initHatenaStar() {
    var s = Hatena.Star;
    // exception "Not enough arguments"...
    // new s.EntryLoader() ?
//    s.EntryLoader.headerTagAndClassName = ['h2', 'item_title'];
//    Keybind.add('H', function(){
//        var stars = new s.EntryLoader();
//    });

    // exception "Not enough arguments"...
    // new s.EntryLoader() ?
//    s.SiteConfig = {
//        entryNodes: {
//            'div.item': {
//                uri:       'h2.item_title > a',
//                title:     'h2.item_title',
//                container: 'h2.item_title'
//            }
//        }
//    };
//
//    channel_widgets.add(
//        'hatena_star',
//        function () {
//            setTimeout(
//                function () {
//                    var e = s.EntryLoader;
//                    var entries = e.entries;
//                    e.entries = null;
//                    new e();
//                    if (entries) {
//                        e.entries = Array.concat(entries, e.entries);
//                    }
//                },
//                3000
//            );
//        }
//    );
}
*/

} // with (w)

// stuff ---
// manual evaluate
// can not use window.eval in unsafeWindow
function evalManually(json) {
    var result = {};
    var data = json.replace(/^{/, '').replace(/}$/, '').split(',');
    for (var i=0, l=data.length ; i<l ; ++i) {
        var temp = data[i].split(':');
        var key = temp.shift().replace(/^"/, '').replace(/"$/, '');
        var value = temp.join(':').replace(/^"/, '').replace(/"$/, '');
        result[key] = value;
    }
    return result;
}
// use GM_* in unsafeWindow
// refer: http://wiki.greasespot.net/0.7.20080121.0_compatibility
function wrapSecurely(f) {
    return function () {
        setTimeout.apply(window, [f, 0].concat([].slice.call(arguments)));
    };
}

} )();

// vim: sw=4 sts=4 ts=4 et
