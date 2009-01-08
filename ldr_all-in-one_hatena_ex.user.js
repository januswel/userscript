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
 * Last Change: 2009/01/08 21:10:40.
 *
 * ACKNOWLEDGMENT
 * this script is based on:
 *  - http://la.ma.la/blog/diary_200610182325.htm
 *  - http://la.ma.la/blog/diary_200707121316.htm
 *  - http://d.hatena.ne.jp/KGA/20070908/1189223454
 *  - http://michilu.com/blog/posts/123/
 *  - http://zeromemory.sblo.jp/article/1230111.html
 *
 * TODO
 * fine-tuning screenshot z-index
 */

( function () {

const KEY_HATENA_BOOKMARK_COMMENT = 'h';
const FILTER_NOT_COMMENT = false;

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
        'the sum of bookmarked on the feed by はてなブックマーク'
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

function displayHatenaBookmarkComment() {
    GM_addStyle(<><![CDATA[
        div.hatebu_container {
            position: relative;
        }
        div.hatebu_container img {
            vertical-align: text-bottom;
        }
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
        img.hatebu_screenshot {
            border: 1px solid #5279E7;
            /* FIXME */
            z-index: 5;
            position: absolute;
            top: 0;
            right: 0;
        }
        ul.hatebu_bookmarks {
            margin:  0px;
            padding: 5px;
            list-style: none;
            font-size: 90%;
            color: gray;
            background-color: #edf1fd;
        }
        ul.hatebu_bookmarks a {
            text-decoration: none;
            color: gray;
        }
        li.hatebu_bookmark * {
            margin: 0;
            padding: 0;
            border: none;
            /* FIXME */
            z-index: 10;
        }
        li.hatebu_invisible {
            display: none;
        }
        span.hatebu_timestamp {
            font-size: 90%;
        }
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
        li.hatebu_tag:before { color: gray; content: open-quote; }
        li.hatebu_tag:after  { color: gray; content: close-quote; }
        span.hatebu_comment {
            margin-left: 6px;
            color: black;
        }
    ]]></>);

    function _onload(response) {
        var itemSelector = 'item_body_' + this.id;
        var itemNode = $(itemSelector);
        if (!itemNode) return;

        var bookmarksNode;
        GM_log(response.responseText);
        if (response.status !== 200) bookmarksNode = buildBookmarksNode(null);
        else {
            var r = eval.call(window, '(' + response.responseText + ')');
            bookmarksNode = r ? buildBookmarksNode(r) : buildBookmarksNode(null);
        }

        var l = itemNode.lastChild;
        if (l.className === 'hatebu_container') l.parentNode.removeChild(l);
        itemNode.innerHTML += bookmarksNode.toXMLString().replace(/\n\s+/g, '');

        // different namespace ?
        //itemNode.appendChild(xmlToDom(bookmarksNode));
    }

    function buildBookmarksNode(response) {
        if (!response || !response.bookmarks || response.bookmarks.length <= 0) {
            return <div class="hatebu_container">
                <h3 class="hatebu_title">comments on はてなブックマーク</h3>
                <p>This entry is not yet bookmarked.</p>
            </div>;
        }

        var entryURL = response.entry_url;
        var countImageURL = 'http://b.hatena.ne.jp/entry/image/normal/' + response.url;
        var screenshotImageURL = response.screenshot;

        var bookmarks = response.bookmarks;
        var numofAll = parseInt(response.count, 10);
        var numofPublic = bookmarks.length;
        var numofPrivate = numofAll - numofPublic;
        var numofDisplayed = numofPublic;
        var bookmarkList = <></>;
        for (var i=0, l=bookmarks.length ; i<l ; ++i) {
            var bookmark = bookmarks[i];
            var invisible = false;
            if (FILTER_NOT_COMMENT && !bookmark.comment) {
                invisible = true;
                --numofDisplayed;
            }
            bookmarkList += buildBookmarkNode(bookmark, invisible);
        }

        return <div class="hatebu_container">
            <h3 class="hatebu_title">
                comments on はてなブックマーク
                <span class="hatebu_status">
                    <span class="hatebu_numof_displayed">{numofDisplayed}</span>/{numofPublic}+{numofPrivate}
                </span>
                <img class="hatebu_screenshot" src={screenshotImageURL} />
            </h3>
            <ul class="hatebu_bookmarks">
                {bookmarkList}
            </ul>
        </div>;
    }

    function buildBookmarkNode(bookmark, invisible) {
        var classes = ['hatebu_bookmark'];
        if (invisible) classes.push(' hatebu_invisible');

        var username = bookmark.user;
        var userIndex = username.substring(0, 2);
        var iconURL = ['http://www.hatena.ne.jp/users', userIndex, username, 'profile_s.gif'].join('/');
        var userURL = 'http://b.hatena.ne.jp/' + username;
        var timestamp = bookmark.timestamp;

        var tagNode = '';
        if (bookmark.tags.length) {
            var tags = bookmark.tags;
            var tagLists = <></>;
            for (var i=0, l=tags.length ; i<l ; ++i) {
                var tag = tags[i]
                var tagURL = ['http://b.hatena.ne.jp', username, tag].join('/');
                tagLists += <li class="hatebu_tag"><a href={tagURL}>{tag}</a></li>;
            }
            tagNode = <ul class="hatebu_tags">{tagLists}</ul>;
        }

        return <li class={classes.join(' ')}>
            <span class="hatebu_timestamp">{timestamp}</span>
            <a class="hatebu_user" href={userURL}>
                <img class="hatebu_usericon" src={iconURL} alt={username} title={username} width="16" height="16" />
                <span class="hatebu_username">{username}</span>
            </a>
            {tagNode}
            <span class="hatebu_comment">{bookmark.comment}</span>
        </li>;
    }

    Keybind.add(
        KEY_HATENA_BOOKMARK_COMMENT,
        function () {
            var item = get_active_item(true);
            if (!item) return;
            var url = 'http://b.hatena.ne.jp/entry/json/' + item.link;

            wrapSecurely(function () {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    url,
                    onload: bind(_onload, item),
                });
            })();
        }
    );
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
*/

} )();

// vim: sw=4 sts=4 ts=4 et
