// Generated by CoffeeScript 1.12.7
(function() {
  var _path, assign, httpify, mime, ref1;

  ref1 = require("../helpers"), httpify = ref1.httpify, assign = ref1.assign;

  mime = require("mime-types");

  _path = require("path");

  module.exports = function(app, options) {
    var BadRequestError, NotFoundError, NotModified, ref2;
    ref2 = app.errors, BadRequestError = ref2.BadRequestError, NotModified = ref2.NotModified, NotFoundError = ref2.NotFoundError;
    app.get("/:git_repo(.*).git/:refname(.*)?/commit", app.authorize("browse"), function(req, res, next) {
      var disposable, etag, git_repo, ref3, ref4, refname, repositories;
      ref3 = req.params, git_repo = ref3.git_repo, refname = ref3.refname;
      ref4 = req.git, repositories = ref4.repositories, disposable = ref4.disposable;
      etag = req.headers["if-none-match"];
      return repositories.ref(git_repo, refname).then(function(arg) {
        var ref, repo;
        ref = arg[0], repo = arg[1];
        if (!((repo != null) && (ref != null))) {
          throw new NotFoundError;
        }
        if (("" + (ref.target())) === etag) {
          throw new NotModified;
        }
        return repo.getCommit(ref.target());
      }).then(disposable).then(function(commit) {
        res.set(app.cacheHeaders(commit));
        return res.json(assign({
          type: "commit"
        }, commit.toJSON()));
      }).then(function() {
        return next();
      })["catch"](next);
    });
    app.get("/:git_repo(.*).git/:refname(.*)?/blob/:path(.*)", app.authorize("browse"), function(req, res, next) {
      var disposable, etag, git_repo, path, ref3, ref4, refname, repositories;
      ref3 = req.params, git_repo = ref3.git_repo, path = ref3.path, refname = ref3.refname;
      if (!path) {
        return next(new BadRequestError);
      }
      ref4 = req.git, repositories = ref4.repositories, disposable = ref4.disposable;
      etag = req.headers["if-none-match"];
      return repositories.entry(git_repo, refname, path).then(function(arg) {
        var entry;
        entry = arg[0];
        if (entry == null) {
          throw new NotFoundError("Entry not found");
        }
        if (entry.isTree()) {
          throw new BadRequestError;
        }
        if (entry.sha() === etag) {
          throw new NotModified;
        }
        return entry.getBlob();
      }).then(disposable).then(function(blob) {
        var binary, content, encoding, size, truncate;
        binary = blob.isBinary() ? true : false;
        size = blob.rawsize();
        content = blob.content();
        truncate = size > options.max_size;
        if (truncate) {
          content = content.slice(0, options.max_size);
        }
        encoding = binary ? "base64" : "utf8";
        res.set(app.cacheHeaders(blob));
        return res.json({
          type: "blob",
          id: "" + (blob.id()),
          binary: binary,
          mime: mime.lookup(path),
          path: path,
          filename: _path.basename(path),
          contents: blob.toString(encoding),
          truncated: truncate,
          encoding: encoding,
          size: size
        });
      }).then(function() {
        return next();
      })["catch"](httpify(404))["catch"](next);
    });
    return app.get("/:git_repo(.*).git/:refname(.*)?/tree/:path(.*)?", app.authorize("browse"), function(req, res, next) {
      var disposable, etag, git_repo, path, ref3, ref4, refname, repositories;
      ref3 = req.params, git_repo = ref3.git_repo, path = ref3.path, refname = ref3.refname;
      ref4 = req.git, repositories = ref4.repositories, disposable = ref4.disposable;
      etag = req.headers["if-none-match"];
      return repositories.commit(git_repo, refname).then(function(arg) {
        var commit;
        commit = arg[0];
        if (path) {
          return commit.getEntry(path).then(disposable).then(function(entry) {
            if (!entry.isTree()) {
              throw new BadRequestError;
            }
            if (entry.sha() === etag) {
              throw new NotModified;
            }
            return entry.getTree();
          });
        } else {
          return commit.getTree();
        }
      }).then(disposable).then(function(tree) {
        var entry;
        res.set(app.cacheHeaders(tree));
        return res.json({
          type: "tree",
          id: "" + (tree.id()),
          name: _path.basename(path),
          path: path,
          entries: (function() {
            var i, len, ref5, results;
            ref5 = tree.entries();
            results = [];
            for (i = 0, len = ref5.length; i < len; i++) {
              entry = ref5[i];
              results.push(entry.toJSON());
            }
            return results;
          })()
        });
      }).then(function() {
        return next();
      })["catch"](next);
    });
  };

}).call(this);
