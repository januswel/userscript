// ==UserScript==
// @name           LDR all-in-one Hatena extension
// @namespace      http://d.hatena.ne.jp/janus_wel/
// @description    add various features with services provided by Hatena, to LDR / Fastladder
// @include        http://reader.livedoor.com/reader/*
// @include        http://fastladder.com/reader/*
// @version        0.40
// @author         janus_wel<janus.wel.3@gmail.com>
// ==/UserScript==

/*
 * Last Change: 2009/01/09 16:08:45.
 *
 * ACKNOWLEDGMENT
 * this script is based on:
 *  - http://la.ma.la/blog/diary_200610182325.htm
 *  - http://la.ma.la/blog/diary_200707121316.htm
 *  - http://d.hatena.ne.jp/KGA/20070908/1189223454
 *  - http://michilu.com/blog/posts/123/
 *  - http://zeromemory.sblo.jp/article/1230111.html
 *  - http://d.hatena.ne.jp/aki77/20060601/1149184418
 */

( function () {

const KEY_HATENA_BOOKMARK_COMMENT = 'h';
const KEY_TOGGLE_COMMENT_FILTER = 'H';
const LOCALE = (function getLocale() {
    const LOCALE_ALL = [
        {
            name: 'livedoor Reader',
            url:  '^http://reader\.livedoor\.com/reader/',
            data: {
                SUMOF_HATENA_BOOKMARK_DESC: '現在のフィードのはてなブックマークにおける被ブックマーク数合計',
                NUMOF_HATENA_BOOKMARK_DESC: '現在のアイテムのはてなブックマークにおける被ブックマーク数合計',
                SUMOF_HATENA_STAR_DESC:     '現在のフィードのはてなスター数合計',
                HATEBU_COMMENT_TITLE:       'はてなブックマークコメント',
                HATEBU_COMMENT_LOADING:     'はてなブックマークからロード中…',
                HATEBU_COMMENT_COMPLETE:    'ロード完了。',
            },
        },
        {
            name: 'Fastladder',
            url:  '^http://fastladder\.com/reader/',
            data: {
                SUMOF_HATENA_BOOKMARK_DESC: 'the sum of bookmarked on the feed by Hatena Bookmark',
                NUMOF_HATENA_BOOKMARK_DESC: 'the number of bookmarked on the entry by Hatena Bookmark',
                SUMOF_HATENA_STAR_DESC:     'the sum of Hatena Star on the feed',
                HATEBU_COMMENT_TITLE:       'comments on Hatena Bookmark',
                HATEBU_COMMENT_LOADING:     'Loading Hatena Bookmark comments...',
                HATEBU_COMMENT_COMPLETE:    'Loading completed.',
            },
        },
    ];

    for (var i=0, l=LOCALE_ALL.length ; i<l ; ++i) {
        var locale = LOCALE_ALL[i]
        if (locale.url.match(document.location.href)) return locale.data;
    }
    return null;
})();

// main ---
window.addEventListener(
    'load',
    function () {
        sumofHatenaBookmark();
        numofHatenaBookmark();
        sumofHatenaStar();
        displayHatenaBookmarkComment();
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
            var link = feed.channel.link;
            var hatenaBookmark = {
                url:     'http://b.hatena.ne.jp/entrylist?url=' + link,
                counter: 'http://b.hatena.ne.jp/bc/' + link,
            };

            return <a href={hatenaBookmark.url}>
                <img style="vertical-align:middle; border:none;" src={hatenaBookmark.counter} />
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
                <img src="http://d.hatena.ne.jp/images/b_entry.gif" style="border:none;" />
                <img style="border:none; margin-left:3px;" src={hatenaBookmark.counter} />
            </a>;
        },
        LOCALE.NUMOF_HATENA_BOOKMARK_DESC
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

    function _onload(r) {
        // nothing to do, if data is not exist
        if (r.status !== 200) return;

        // use call to avoid below error
        //  function eval must be called directly, and not by way of a function of another name
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
                node.parentNode.style.display = 'inline';
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

            return <>
                <img style="border:none;" src="http://s.hatena.ne.jp/images/star.gif" />
                <span id={hatenaStar.id}>-</span>
            </>;
        },
        LOCALE.SUMOF_HATENA_STAR_DESC
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

function displayHatenaBookmarkComment() {
    // style sheet settings
    // all styles have prefix "hatebu_" of class name
    GM_addStyle(<><![CDATA[
        /* container */
        div.hatebu_container img { vertical-align: text-bottom; }

        /* title and status */
        h3.hatebu_title {
            border-bottom: 1px solid #5279E7;
            font-family: Arial, Sans-Serif;
            font-size:   16px;
            font-weight: bolder;
            color: #6060c0;
        }
        span.hatebu_status { quotes: '(' ')'; }
        span.hatebu_status:before { content: open-quote; }
        span.hatebu_status:after  { content: close-quote; }

        /* screenshot */
        img.hatebu_screenshot {
            display: block;
            float: left;
            margin: 10px;
            border: 1px solid #5279E7;
        }

        /* bookmarks list */
        ul.hatebu_bookmarks {
            margin:  0px;
            padding: 5px;
            list-style: none;
            font-size: 90%;
            color: gray;
            background-color: #edf1fd;
            min-height: 105px;
        }
        ul.hatebu_bookmarks * {
            margin: 0;
            padding: 0;
            border: none;
        }
        ul.hatebu_bookmarks a {
            text-decoration: none;
            color: gray;
        }

        /* attributes */
        span.hatebu_timestamp { font-size: 90%; }
        a.hatebu_user {
            margin-left: 6px;
            color: #6060c0;
        }
        ul.hatebu_tags {
            display: inline;
            margin-left: 6px;
            list-style: none;
            font-size: 90%;
            text-decoration: none;
            color: #66c;
        }
        li.hatebu_tag {
            display: inline;
            quotes: '[' ']';
        }
        li.hatebu_tag:before, li.hatebu_tag:after { color: gray; }
        li.hatebu_tag:before { content: open-quote; }
        li.hatebu_tag:after  { content: close-quote; }
        span.hatebu_comment {
            margin-left: 6px;
            color: black;
        }
    ]]></>);

    // display Hatena Bookmark comments
    Keybind.add(
        KEY_HATENA_BOOKMARK_COMMENT,
        function () {
            var item = get_active_item(true);
            if (!item) return;
            var url = 'http://b.hatena.ne.jp/entry/json/' + item.link;

            orderNakaNoHito('loading');
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
    function orderNakaNoHito(state) {
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

    function _onload(response) {
        var itemSelector = 'item_body_' + this.id;
        var itemNode = $(itemSelector);
        if (!itemNode) return;

        var bookmarksNode;
        if (response.status !== 200) bookmarksNode = buildBookmarksNode(null);
        else {
            // use "call" to specify "window" ( cause by security, in "unsafeWindow" )
            // if no bookmarks, r will be "null" ( Hatena return string "(null)" )
            var r = eval.call(window, '(' + response.responseText + ')');
            bookmarksNode = buildBookmarksNode(r);
        }

        // remove inserted elements previously
        var l = itemNode.lastChild;
        if (l.className === 'hatebu_container') l.parentNode.removeChild(l);
        // remove unnecessary breaks and spaces, and insert !!
        itemNode.innerHTML += bookmarksNode.toXMLString().replace(/\n\s+/g, '');

        // inserted elements can not applied style by this way
        // namespace is different?
        //itemNode.appendChild(xmlToDom(bookmarksNode));

        orderNakaNoHito('complete');
    }

    // just pack data
    function buildBookmarksNode(response) {
        var noData = !response || !response.bookmarks || (response.bookmarks.length <= 0);
        if (noData) return templateBookmarkNode({ noData: noData });

        // summary of the entry
        var bookmarks = response.bookmarks;
        var numofAll = parseInt(response.count, 10);
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
                tags:      tagList,
                comment:   bookmark.comment,
            });
        }

        // whole data are ready
        var data = {
            title:              LOCALE.HATEBU_COMMENT_TITLE,
            noData:             noData,
            numofAll:           numofAll,
            numofPublic:        numofPublic,
            numofPrivate:       numofPrivate,
            numofComment:       numofComment,
            screenshotImageURL: response.screenshot,
            bookmarkList:       bookmarkList,
        };

        // generate XML nodes
        return templateBookmarkNode(data);
    }

    // E4X hell
    function templateBookmarkNode(d) {
        return <div class="hatebu_container">
            <h3 class="hatebu_title">
                {d.title}
                <span class="hatebu_status">{d.numofComment}/{d.numofPublic}+{d.numofPrivate}</span>
            </h3>

            {tmplIf(d.noData, function () {
            return <p>This entry is not yet bookmarked.</p>
            }, function () {
            return <>
            <img class="hatebu_screenshot" src={d.screenshotImageURL} />
            <ul class="hatebu_bookmarks">

                {tmplLoop(d.bookmarkList, function (b) {
                return <li class={b.className}>
                    <span class="hatebu_timestamp">{b.timestamp}</span>
                    <a class="hatebu_user" href={b.userURL}>
                        <img class="hatebu_usericon" src={b.iconURL} alt={b.username} width="16" height="16" />
                        <span class="hatebu_username">{b.username}</span>
                    </a>

                    {tmplIf(b.tags.length, function () {
                    return <ul class="hatebu_tags">

                        {tmplLoop(b.tags, function (t) {
                        return <li class="hatebu_tag">
                            <a href={t.tagURL}>{t.tag}</a>
                        </li>;
                        })}

                    </ul>
                    })}

                    <span class="hatebu_comment">{b.comment}</span>
                </li>;
                })}

            </ul>
            </>
            })}

        </div>;
    }

    // comment filter
    availableCommentFilter() ? hideComment() : showComment();
    GM_registerMenuCommand('toggle comment filter', toggleCommentFilter);
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

function bind(func, object) {
    return function () {
        return func.apply(object, arguments);
    }
}

// emulate Perl HTML::Template with E4X
// TMPL_LOOP
function tmplLoop(data, action) {
    var result = <></>;
    for (var i=0, l=data.length ; i<l ; ++i) result += action(data[i]);
    return result;
}
// TMPL_IF / TMPL_ELSE
function tmplIf(flag, trueAction, falseAction) {
    if (flag) return trueAction();
    else if (falseAction) return falseAction();
}

/*
function xmlToDom(xml, xmlns) {
    var wrapped = (xmlns)
        ? '<root xmlns="' + xmlns + '">' + xml.toXMLString() + '</root>'
        : '<root>' + xml.toXMLString() + '</root>';
    var doc = (new DOMParser).parseFromString(wrapped, 'application/xml');

    var imported = document.importNode(doc.documentElement, true);
    var range = document.createRange();
    range.selectNodeContents(imported);
    var fragment = range.extractContents();
    range.detach();
    return fragment.childNodes.length > 1 ? fragment : fragment.firstChild;
}
*/

} )();

// vim: sw=4 sts=4 ts=4 et
