// ==UserScript==
// @name           LDR all-in-one Hatena extension
// @namespace      http://d.hatena.ne.jp/janus_wel/
// @description    add various features to LDR / Fastladder
// @include        http://reader.livedoor.com/reader/*
// @include        http://fastladder.com/reader/*
// @version        0.1
// ==/UserScript==

// based on: http://la.ma.la/blog/diary_200610182325.htm
// based on: http://la.ma.la/blog/diary_200707121316.htm
// based on: http://d.hatena.ne.jp/KGA/20070908/1189223454
// based on: http://michilu.com/blog/posts/123/

( function () {

const w = unsafeWindow || window;

// display the sum of bookmarked on the feed by はてなブックマーク
w.channel_widgets.add(
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


// display the number of bookmarked on the entry by はてなブックマーク
w.entry_widgets.add(
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


// display the sum of はてなスター on the feed
/* not work
w.channel_widgets.add(
    'sum_of_HatenaStar',
    function (feed) {
        var hsURL = 'http://s.hatena.ne.jp/blog.json/' + feed.channel.link;
        var hsId = 'hs-' + feed.subscribe_id;

        // can not use in unsafeWindow ?
//        GM_xmlhttpRequest({
//            method: 'GET',
//            url:    hsURL,
//            onload: function (req) {
//                GM_log(req.status);
//                var obj = eval('(' + req.responseText + ')');
//                GM_log(obj.star_count);
//                var node = w.document.getElementById(hsId);
//                node.textContent = obj.star_count;
//            },
//        });

        // error "illegal value" ... ?
//        var loader = new w.ScriptLoader(hsURL);
//        loader.get(
//            {},
//            function (obj) {
//                var node = w.document.getElementById(hsId);
//                if (node) node.innerHTML = obj.star_count;
//            }
//        );

        return <span style="color:#f4b128;font-weight:bold;">
            <img style="border:none;" src="http://s.hatena.ne.jp/images/star.gif" />
            <span id={hsId}>0</span>
        </span>;
    },
    'the sum of はてなスター on the feed'
);
*/


// display and add はてなスター to entry.
/* not work
includeHatenaStar();
var t = setInterval(
    function() {
        if (w.Hatena) {
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
    var s = w.Hatena.Star;
    // exception "Not enough arguments"...
    // new s.EntryLoader() ?
//    s.EntryLoader.headerTagAndClassName = ['h2', 'item_title'];
//    w.Keybind.add('H', function(){
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
//    w.channel_widgets.add(
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

} )();

// vim: sw=4 sts=4 ts=4 et
