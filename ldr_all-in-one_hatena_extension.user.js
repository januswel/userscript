// ==UserScript==
// @name           LDR all-in-one Hatena extension
// @namespace      http://d.hatena.ne.jp/janus_wel/
// @description    add various features with services provided by Hatena, to LDR / Fastladder
// @include        http://reader.livedoor.com/reader/*
// @include        http://fastladder.com/reader/*
// @version        0.62
// @author         janus_wel<janus.wel.3@gmail.com>
// @require        http://github.com/januswel/jslibrary/raw/master/HTMLTemplate.js
// @resource       LOCALE_JSON         ldr_all-in-one_hatena_extension_locale.json
// @resource       CSS                 ldr_all-in-one_hatena_extension.css
// @resource       HATEBU_COMMENT_TMPL ldr_all-in-one_hatena_extension_hatebu_comment.tmpl
// ==/UserScript==

/*
 * Last Change: 2009/01/12 03:41:38.
 *
 * ACKNOWLEDGMENT
 * this script is based on:
 *  - http://la.ma.la/blog/diary_200610182325.htm
 *  - http://la.ma.la/blog/diary_200707121316.htm
 *  - http://d.hatena.ne.jp/KGA/20070908/1189223454
 *  - ( http://d.hatena.ne.jp/hatenastar/20070707 )
 *  - ( http://michilu.com/blog/posts/123/ )
 *  - http://zeromemory.sblo.jp/article/1230111.html
 *  - http://d.hatena.ne.jp/aki77/20060601/1149184418
 * */

( function () {

// settings ---
// change below keybinds as you like
const KEY_ADD_HATENA_STAR = 'S';
const KEY_HATENA_BOOKMARK_COMMENT = 'C';
const KEY_TOGGLE_COMMENT_FILTER = 'F';

// global constants ---
const LOCALE = getLocale(document.location.href);


// main ---
window.addEventListener(
    'load',
    function () {
        // add style
        GM_addStyle(GM_getResourceText('CSS'));

        // register features
        sumofHatenaBookmark();
        numofHatenaBookmark();
        sumofHatenaStar();
        // not work
//        addHatenaStar();
        displayHatenaBookmarkComment();
    },
    false
);

// feature definition ---
// assumption
const w = unsafeWindow || window;
with (w) {

// display the sum of bookmarked on the feed by はてなブックマーク
function sumofHatenaBookmark() {
    channel_widgets.add(
        'sum_of_HatenaBookmark',
        function (feed) {
            var link = feed.channel.link;
            var hatenaBookmark = {
                url:     'http://b.hatena.ne.jp/entrylist?url=' + link,
                counter: 'http://b.hatena.ne.jp/bc/' + link,
            };

            return <a href={hatenaBookmark.url}>
                <img src={hatenaBookmark.counter} />
            </a>;
        },
        LOCALE.SUMOF_HATENA_BOOKMARK_DESC
    );
}


// display the number of bookmarked on the entry by はてなブックマーク
function numofHatenaBookmark() {
    entry_widgets.add(
        'number_of_HatenaBookmark',
        function (feed, item) {
            var link = item.link.replace(/#/g,'%23');
            var hatenaBookmark = {
                url:     'http://b.hatena.ne.jp/entry/' + link,
                counter: 'http://b.hatena.ne.jp/entry/image/' + link,
            };

            return <a href={hatenaBookmark.url}>
                <img src="http://d.hatena.ne.jp/images/b_entry.gif" />
                <img src={hatenaBookmark.counter} />
            </a>;
        },
        LOCALE.NUMOF_HATENA_BOOKMARK_DESC
    );
}


// display the sum of はてなスター on the feed
function sumofHatenaStar() {
    function _onload(r) {
        // nothing to do, if data is not exist
        if (r.status !== 200) return;

        // use "call" to avoid below error
        //      function eval must be called directly,
        //      and not by way of a function of another name
        // refer: http://d.hatena.ne.jp/brazil/20060821/1156164845
        var s = eval.call(window, '(' + r.responseText + ')');

        // wait for nodes that inserted by channel_widgets.add ( below )
        // probably, interval will finish by first timing
        // (speed to operate DOM vs. to connect Hatena server)
        var id = this.id;
        var count = 0;
        const TIMEOUT_COUNT = 30;
        var t = setInterval( function () {
            var node = $(id);
            if (node) {
                clearInterval(t);
                node.textContent = s.star_count;
                return;
            }
            if (++count >= TIMEOUT_COUNT) clearInterval(t);
        }, 100);
    }

    channel_widgets.add(
        'sum_of_HatenaStar',
        function (feed) {
            var hatenaStar = {
                url: 'http://s.hatena.ne.jp/blog.json/' + feed.channel.link,
                id:  'hs-' + feed.subscribe_id,
            };

            // get wrapped function and run immediately
            wrapSecurely(function () {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    hatenaStar.url,
                    onload: bind(_onload, hatenaStar),
                });
            })();

            return <a href="http://s.hatena.ne.jp/">
                <img src="http://s.hatena.ne.jp/images/star.gif" />
                <span id={hatenaStar.id}>-</span>
            </a>;
        },
        LOCALE.SUMOF_HATENA_STAR_DESC
    );
}


// display and add はてなスター to entry.
/* not work
function addHatenaStar() {
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
        s.type = 'text/javascript';
        s.charset = 'UTF-8';
        s.src = 'http://s.hatena.ne.jp/js/HatenaStar.js';
        document.getElementsByTagName('head')[0].appendChild(s);
    }

    function initHatenaStar() {
        var s = Hatena.Star;
        s.EntryLoader.headerTagAndClassName = ['h2', 'item_title'];
        Keybind.add(KEY_ADD_HATENA_STAR, function(){
            // the error "not enough argument" occur
            var stars = new s.EntryLoader();
        });
    }
}
*/

function displayHatenaBookmarkComment() {
    // prepare HTML Template
    const ht = HTMLTemplateFactory(GM_getResourceText('HATEBU_COMMENT_TMPL'));

    // display Hatena Bookmark comments
    Keybind.add(
        KEY_HATENA_BOOKMARK_COMMENT,
        function () {
            var item = get_active_item(true);
            if (!item) return;
            var url = 'http://b.hatena.ne.jp/entry/json/' + item.link;

            orderToNakaNoHito('loading');
            wrapSecurely(function () {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    url,
                    onload: bind(_onload, item),
                });
            })();
        }
    );

    // order naka-no-hito
    function orderToNakaNoHito(state) {
        switch (state) {
            case 'loading':
                $('loadicon').src = '/img/icon/loading.gif';
                message(LOCALE.HATEBU_COMMENT_LOADING);
                break;
            case 'complete':
                var n = 1 + Math.floor(Math.rand(3));
                $('loadicon').src = '/img/icon/rest' + n + '.gif';
                message(LOCALE.HATEBU_COMMENT_COMPLETE);
                break;
            default:
                break;
        }
    }

    function _onload(r) {
        var itemNode = $('item_body_' + this.id);
        if (!itemNode) return;

        // if no bookmarks, r will be "null" ( Hatena return string "(null)" )
        var bookmarksNode = (r.status !== 200)
            ? buildBookmarksNode(null)
            : buildBookmarksNode(eval.call(window, '(' + r.responseText + ')'));

        // remove inserted elements previously
        var l = itemNode.lastChild;
        if (l.className === 'hatebu_container') l.parentNode.removeChild(l);
        // remove unnecessary breaks and spaces, and insert !!
        itemNode.innerHTML += bookmarksNode.toXMLString().replace(/\n\s+/g, '');

        orderToNakaNoHito('complete');
    }

    // just pack data
    function buildBookmarksNode(hatena) {
        var noData = !hatena || !hatena.bookmarks || (hatena.bookmarks.length <= 0);
        if (noData) return ht.output({
            title:         LOCALE.HATEBU_COMMENT_TITLE,
            noData:        noData,
            noDataMessage: LOCALE.HATEBU_COMMENT_NODATA,
        });

        // summary of the entry
        var bookmarks = hatena.bookmarks;
        var numofAll = parseInt(hatena.count, 10);
        var numofPublic = bookmarks.length;
        var numofPrivate = numofAll - numofPublic;
        var numofComment = numofPublic;

        // each of bookmark data
        var bookmarkList = [];
        for (var i=0, bl=bookmarks.length ; i<bl ; ++i) {
            var bookmark = bookmarks[i];

            // for comment filter
            var className = ['hatebu_bookmark'];
            if (!bookmark.comment) {
                className.push('hatebu_invisible');
                --numofComment;
            }

            // bookmark user
            var username = bookmark.user;
            var userIndex = username.substring(0, 2);

            // each of bookmark tag
            var tags = bookmark.tags;
            var tagList = [];
            for (var j=0, tl=tags.length ; j<tl ; ++j) {
                var tag = tags[j];
                tagList.push({
                    tag:    tag,
                    tagURL: ['http://b.hatena.ne.jp', username, tag].join('/'),
                });
            }

            // just packing
            bookmarkList.push({
                className: className.join(' '),
                username:  username,
                iconURL:   ['http://www.hatena.ne.jp/users', userIndex, username, 'profile_s.gif'].join('/'),
                userURL:   'http://b.hatena.ne.jp/' + username,
                timestamp: bookmark.timestamp,
                tagList:   tagList,
                numofTags: bookmark.tags.length,
                comment:   bookmark.comment,
            });
        }

        // whole data are ready
        var data = {
            title:              LOCALE.HATEBU_COMMENT_TITLE,
            noData:             noData,
            noDataMessage:      LOCALE.HATEBU_COMMENT_NODATA,
            numofAll:           numofAll,
            numofPublic:        numofPublic,
            numofPrivate:       numofPrivate,
            numofComment:       numofComment,
            screenshotImageURL: hatena.screenshot,
            bookmarkList:       bookmarkList,
        };

        // generate XML nodes
        return ht.output(data);
    }

    // comment filter
    availableCommentFilter() ? hideComment() : showComment();
    GM_registerMenuCommand('LDR all-in-one Hatena extension - toggle comment filter', toggleCommentFilter);
    Keybind.add(KEY_TOGGLE_COMMENT_FILTER, wrapSecurely(toggleCommentFilter));

    function showComment() { LDR_addStyle('li.hatebu_invisible', 'display: list-item;'); }
    function hideComment() { LDR_addStyle('li.hatebu_invisible', 'display: none;'); }
    function availableCommentFilter() { return GM_getValue('availableCommentFilter', true); }
    function toggleCommentFilter() {
        var e = !availableCommentFilter();
        e ? hideComment() : showComment();
        GM_setValue('availableCommentFilter', e);
    }
}

} // with (w)

// stuff ---
// use GM_* in unsafeWindow
// refer: http://wiki.greasespot.net/0.7.20080121.0_compatibility
// refer: http://nanto.asablo.jp/blog/2008/02/14/2626240
function wrapSecurely(f) {
    return function () {
        setTimeout.apply(window, [f, 0].concat(Array.slice(arguments)));
    };
}

// for GM_xmlhttpRequest
function bind(func, object) {
    return function () {
        return func.apply(object, arguments);
    }
}

// judge locale automatically
function getLocale(url) {
    const LOCALE_ALL = eval('(' + GM_getResourceText('LOCALE_JSON') + ')');

    for (var i=0, l=LOCALE_ALL.length ; i<l ; ++i) {
        var locale = LOCALE_ALL[i]
        if (locale.url.match(url)) return locale.data;
    }

    throw new Error('Locale data is not found this page: ' + url);
}

} )();

// vim: sw=4 sts=4 ts=4 et
