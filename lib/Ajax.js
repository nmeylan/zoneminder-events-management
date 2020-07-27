const ajax = (path, options) => {
  let opts = {};
  if (options) {
    opts = options;
  }
  opts.credentials = 'include';
  if (opts.headers && !opts.headers["Content-Type"]) {
    opts.headers["Content-Type"] = 'application/json';
  } else if (!opts.headers) {
    opts.headers = {"Content-Type": 'application/json'};
  }
  let root = process.env.REACT_APP_API_ENDPOINT;
  if (!root) {
    root = '';
  }
  if (opts.body && opts.headers["Content-Type"] === 'application/json') {
    opts.body = JSON.stringify(opts.body);
  }
  if (root.endsWith('/')) {
    root = root.substring(0, root.length - 1)
  }
  return fetch(root + path, opts)
};

const ajaxJSON = (ajaxMethod) => {
  return new Promise((resolve, reject) => {
    try {
      ajaxMethod().then(response => {
        if (response.ok) {
          response.json().then(resolve);
        } else {
          reject(response);
        }
      })
    } catch (e) {
      reject(e);
    }

  })
};

const post = (path, options) => {
  let opts = {};
  if (options) {
    opts = options;
  }
  opts.method = 'POST';
  return ajax(path, opts);
};

const postJSON = (path, options) => ajaxJSON(() => post(path, options));

const patch = (path, options) => {
  let opts = {};
  if (options) {
    opts = options;
  }
  opts.method = 'PATCH';
  return ajax(path, opts);
};

const put = (path, options) => {
  let opts = {};
  if (options) {
    opts = options;
  }
  opts.method = 'PUT';
  return ajax(path, opts);
};
const putJSON = (path, options) => ajaxJSON(() => put(path, options));

const del = (path, options) => {
  let opts = {};
  if (options) {
    opts = options;
  }
  opts.method = 'DELETE';
  return ajax(path, opts);
};

const get = (path, options) => ajax(path, options);
const getJSON = (path, options) => ajaxJSON(() => get(path, options));

export default ajax;
export {post, postJSON, patch, get, getJSON, del, put, putJSON};
