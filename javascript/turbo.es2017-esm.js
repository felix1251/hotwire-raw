/*!
Turbo 8.0.0-beta.2
Copyright © 2023 37signals LLC
*/ !(function (e) {
  "function" != typeof e.requestSubmit &&
    (e.requestSubmit = function (e) {
      var r, i;
      e
        ? ((r = e),
          (i = this),
          r instanceof HTMLElement ||
            t(TypeError, "parameter 1 is not of type 'HTMLElement'"),
          "submit" == r.type ||
            t(TypeError, "The specified element is not a submit button"),
          r.form == i ||
            t(
              DOMException,
              "The specified element is not owned by this form element",
              "NotFoundError"
            ),
          e.click())
        : (((e = document.createElement("input")).type = "submit"),
          (e.hidden = !0),
          this.appendChild(e),
          e.click(),
          this.removeChild(e));
    });
  function t(e, t, r) {
    throw new e(
      "Failed to execute 'requestSubmit' on 'HTMLFormElement': " + t + ".",
      r
    );
  }
})(HTMLFormElement.prototype);
let submittersByForm = new WeakMap();
function findSubmitterFromClickTarget(e) {
  let t = e instanceof Element ? e : e instanceof Node ? e.parentElement : null,
    r = t ? t.closest("input, button") : null;
  return r?.type == "submit" ? r : null;
}
function clickCaptured(e) {
  let t = findSubmitterFromClickTarget(e.target);
  t && t.form && submittersByForm.set(t.form, t);
}
!(function () {
  if ("submitter" in Event.prototype) return;
  let e = window.Event.prototype;
  if ("SubmitEvent" in window) {
    let t = window.SubmitEvent.prototype;
    if (!/Apple Computer/.test(navigator.vendor) || "submitter" in t) return;
    e = t;
  }
  addEventListener("click", clickCaptured, !0),
    Object.defineProperty(e, "submitter", {
      get() {
        if ("submit" == this.type && this.target instanceof HTMLFormElement)
          return submittersByForm.get(this.target);
      },
    });
})();
let FrameLoadingStyle = { eager: "eager", lazy: "lazy" };
class FrameElement extends HTMLElement {
  static delegateConstructor = void 0;
  loaded = Promise.resolve();
  static get observedAttributes() {
    return ["disabled", "complete", "loading", "src"];
  }
  constructor() {
    super(), (this.delegate = new FrameElement.delegateConstructor(this));
  }
  connectedCallback() {
    this.delegate.connect();
  }
  disconnectedCallback() {
    this.delegate.disconnect();
  }
  reload() {
    return this.delegate.sourceURLReloaded();
  }
  attributeChangedCallback(e) {
    "loading" == e
      ? this.delegate.loadingStyleChanged()
      : "complete" == e
      ? this.delegate.completeChanged()
      : "src" == e
      ? this.delegate.sourceURLChanged()
      : this.delegate.disabledChanged();
  }
  get src() {
    return this.getAttribute("src");
  }
  set src(e) {
    e ? this.setAttribute("src", e) : this.removeAttribute("src");
  }
  get refresh() {
    return this.getAttribute("refresh");
  }
  set refresh(e) {
    e ? this.setAttribute("refresh", e) : this.removeAttribute("refresh");
  }
  get loading() {
    return frameLoadingStyleFromString(this.getAttribute("loading") || "");
  }
  set loading(e) {
    e ? this.setAttribute("loading", e) : this.removeAttribute("loading");
  }
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(e) {
    e ? this.setAttribute("disabled", "") : this.removeAttribute("disabled");
  }
  get autoscroll() {
    return this.hasAttribute("autoscroll");
  }
  set autoscroll(e) {
    e
      ? this.setAttribute("autoscroll", "")
      : this.removeAttribute("autoscroll");
  }
  get complete() {
    return !this.delegate.isLoading;
  }
  get isActive() {
    return this.ownerDocument === document && !this.isPreview;
  }
  get isPreview() {
    return this.ownerDocument?.documentElement?.hasAttribute(
      "data-turbo-preview"
    );
  }
}
function frameLoadingStyleFromString(e) {
  return "lazy" === e.toLowerCase()
    ? FrameLoadingStyle.lazy
    : (0, FrameLoadingStyle.eager);
}
function expandURL(e) {
  return new URL(e.toString(), document.baseURI);
}
function getAnchor(e) {
  let t;
  return e.hash
    ? e.hash.slice(1)
    : (t = e.href.match(/#(.*)$/))
    ? t[1]
    : void 0;
}
function getAction$1(e, t) {
  let r = t?.getAttribute("formaction") || e.getAttribute("action") || e.action;
  return expandURL(r);
}
function getExtension(e) {
  return (getLastPathComponent(e).match(/\.[^.]*$/) || [])[0] || "";
}
function isHTML(e) {
  return !!getExtension(e).match(/^(?:|\.(?:htm|html|xhtml|php))$/);
}
function isPrefixedBy(e, t) {
  let r = getPrefix(t);
  return e.href === expandURL(r).href || e.href.startsWith(r);
}
function locationIsVisitable(e, t) {
  return isPrefixedBy(e, t) && isHTML(e);
}
function getRequestURL(e) {
  let t = getAnchor(e);
  return null != t ? e.href.slice(0, -(t.length + 1)) : e.href;
}
function toCacheKey(e) {
  return getRequestURL(e);
}
function urlsAreEqual(e, t) {
  return expandURL(e).href == expandURL(t).href;
}
function getPathComponents(e) {
  return e.pathname.split("/").slice(1);
}
function getLastPathComponent(e) {
  return getPathComponents(e).slice(-1)[0];
}
function getPrefix(e) {
  return addTrailingSlash(e.origin + e.pathname);
}
function addTrailingSlash(e) {
  return e.endsWith("/") ? e : e + "/";
}
class FetchResponse {
  constructor(e) {
    this.response = e;
  }
  get succeeded() {
    return this.response.ok;
  }
  get failed() {
    return !this.succeeded;
  }
  get clientError() {
    return this.statusCode >= 400 && this.statusCode <= 499;
  }
  get serverError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
  get redirected() {
    return this.response.redirected;
  }
  get location() {
    return expandURL(this.response.url);
  }
  get isHTML() {
    return (
      this.contentType &&
      this.contentType.match(
        /^(?:text\/([^\s;,]+\b)?html|application\/xhtml\+xml)\b/
      )
    );
  }
  get statusCode() {
    return this.response.status;
  }
  get contentType() {
    return this.header("Content-Type");
  }
  get responseText() {
    return this.response.clone().text();
  }
  get responseHTML() {
    return this.isHTML ? this.response.clone().text() : Promise.resolve(void 0);
  }
  header(e) {
    return this.response.headers.get(e);
  }
}
function activateScriptElement(e) {
  if ("false" == e.getAttribute("data-turbo-eval")) return e;
  {
    let t = document.createElement("script"),
      r = getMetaContent("csp-nonce");
    return (
      r && (t.nonce = r),
      (t.textContent = e.textContent),
      (t.async = !1),
      copyElementAttributes(t, e),
      t
    );
  }
}
function copyElementAttributes(e, t) {
  for (let { name: r, value: i } of t.attributes) e.setAttribute(r, i);
}
function createDocumentFragment(e) {
  let t = document.createElement("template");
  return (t.innerHTML = e), t.content;
}
function dispatch(e, { target: t, cancelable: r, detail: i } = {}) {
  let s = new CustomEvent(e, {
    cancelable: r,
    bubbles: !0,
    composed: !0,
    detail: i,
  });
  return (
    t && t.isConnected
      ? t.dispatchEvent(s)
      : document.documentElement.dispatchEvent(s),
    s
  );
}
function nextRepaint() {
  return "hidden" === document.visibilityState
    ? nextEventLoopTick()
    : nextAnimationFrame();
}
function nextAnimationFrame() {
  return new Promise((e) => requestAnimationFrame(() => e()));
}
function nextEventLoopTick() {
  return new Promise((e) => setTimeout(() => e(), 0));
}
function nextMicrotask() {
  return Promise.resolve();
}
function parseHTMLDocument(e = "") {
  return new DOMParser().parseFromString(e, "text/html");
}
function unindent(e, ...t) {
  let r = interpolate(e, t).replace(/^\n/, "").split("\n"),
    i = r[0].match(/^\s+/),
    s = i ? i[0].length : 0;
  return r.map((e) => e.slice(s)).join("\n");
}
function interpolate(e, t) {
  return e.reduce((e, r, i) => {
    let s = void 0 == t[i] ? "" : t[i];
    return e + r + s;
  }, "");
}
function uuid() {
  return Array.from({ length: 36 })
    .map((e, t) =>
      8 == t || 13 == t || 18 == t || 23 == t
        ? "-"
        : 14 == t
        ? "4"
        : 19 == t
        ? (Math.floor(4 * Math.random()) + 8).toString(16)
        : Math.floor(15 * Math.random()).toString(16)
    )
    .join("");
}
function getAttribute(e, ...t) {
  for (let r of t.map((t) => t?.getAttribute(e)))
    if ("string" == typeof r) return r;
  return null;
}
function hasAttribute(e, ...t) {
  return t.some((t) => t && t.hasAttribute(e));
}
function markAsBusy(...e) {
  for (let t of e)
    "turbo-frame" == t.localName && t.setAttribute("busy", ""),
      t.setAttribute("aria-busy", "true");
}
function clearBusyState(...e) {
  for (let t of e)
    "turbo-frame" == t.localName && t.removeAttribute("busy"),
      t.removeAttribute("aria-busy");
}
function waitForLoad(e, t = 2e3) {
  return new Promise((r) => {
    let i = () => {
      e.removeEventListener("error", i), e.removeEventListener("load", i), r();
    };
    e.addEventListener("load", i, { once: !0 }),
      e.addEventListener("error", i, { once: !0 }),
      setTimeout(r, t);
  });
}
function getHistoryMethodForAction(e) {
  switch (e) {
    case "replace":
      return history.replaceState;
    case "advance":
    case "restore":
      return history.pushState;
  }
}
function isAction(e) {
  return "advance" == e || "replace" == e || "restore" == e;
}
function getVisitAction(...e) {
  let t = getAttribute("data-turbo-action", ...e);
  return isAction(t) ? t : null;
}
function getMetaElement(e) {
  return document.querySelector(`meta[name="${e}"]`);
}
function getMetaContent(e) {
  let t = getMetaElement(e);
  return t && t.content;
}
function setMetaContent(e, t) {
  let r = getMetaElement(e);
  return (
    r ||
      ((r = document.createElement("meta")).setAttribute("name", e),
      document.head.appendChild(r)),
    r.setAttribute("content", t),
    r
  );
}
function findClosestRecursively(e, t) {
  if (e instanceof Element)
    return (
      e.closest(t) ||
      findClosestRecursively(e.assignedSlot || e.getRootNode()?.host, t)
    );
}
function elementIsFocusable(e) {
  return (
    !!e &&
    null ==
      e.closest(
        "[inert], :disabled, [hidden], details:not([open]), dialog:not([open])"
      ) &&
    "function" == typeof e.focus
  );
}
function queryAutofocusableElement(e) {
  return Array.from(e.querySelectorAll("[autofocus]")).find(elementIsFocusable);
}
async function around(e, t) {
  let r = t();
  e(), await nextAnimationFrame();
  let i = t();
  return [r, i];
}
class LimitedSet extends Set {
  constructor(e) {
    super(), (this.maxSize = e);
  }
  add(e) {
    if (this.size >= this.maxSize) {
      let t = this.values(),
        r = t.next().value;
      this.delete(r);
    }
    super.add(e);
  }
}
let recentRequests = new LimitedSet(20),
  nativeFetch = window.fetch;
function fetchWithTurboHeaders(e, t = {}) {
  let r = new Headers(t.headers || {}),
    i = uuid();
  return (
    recentRequests.add(i),
    r.append("X-Turbo-Request-Id", i),
    nativeFetch(e, { ...t, headers: r })
  );
}
function fetchMethodFromString(e) {
  switch (e.toLowerCase()) {
    case "get":
      return FetchMethod.get;
    case "post":
      return FetchMethod.post;
    case "put":
      return FetchMethod.put;
    case "patch":
      return FetchMethod.patch;
    case "delete":
      return FetchMethod.delete;
  }
}
let FetchMethod = {
  get: "get",
  post: "post",
  put: "put",
  patch: "patch",
  delete: "delete",
};
function fetchEnctypeFromString(e) {
  switch (e.toLowerCase()) {
    case FetchEnctype.multipart:
      return FetchEnctype.multipart;
    case FetchEnctype.plain:
      return FetchEnctype.plain;
    default:
      return FetchEnctype.urlEncoded;
  }
}
let FetchEnctype = {
  urlEncoded: "application/x-www-form-urlencoded",
  multipart: "multipart/form-data",
  plain: "text/plain",
};
class FetchRequest {
  abortController = new AbortController();
  #a = (e) => {};
  constructor(
    e,
    t,
    r,
    i = new URLSearchParams(),
    s = null,
    n = FetchEnctype.urlEncoded
  ) {
    let [o, a] = buildResourceAndBody(expandURL(r), t, i, n);
    (this.delegate = e),
      (this.url = o),
      (this.target = s),
      (this.fetchOptions = {
        credentials: "same-origin",
        redirect: "follow",
        method: t,
        headers: { ...this.defaultHeaders },
        body: a,
        signal: this.abortSignal,
        referrer: this.delegate.referrer?.href,
      }),
      (this.enctype = n);
  }
  get method() {
    return this.fetchOptions.method;
  }
  set method(e) {
    let t = this.isSafe
        ? this.url.searchParams
        : this.fetchOptions.body || new FormData(),
      r = fetchMethodFromString(e) || FetchMethod.get;
    this.url.search = "";
    let [i, s] = buildResourceAndBody(this.url, r, t, this.enctype);
    (this.url = i),
      (this.fetchOptions.body = s),
      (this.fetchOptions.method = r);
  }
  get headers() {
    return this.fetchOptions.headers;
  }
  set headers(e) {
    this.fetchOptions.headers = e;
  }
  get body() {
    return this.isSafe ? this.url.searchParams : this.fetchOptions.body;
  }
  set body(e) {
    this.fetchOptions.body = e;
  }
  get location() {
    return this.url;
  }
  get params() {
    return this.url.searchParams;
  }
  get entries() {
    return this.body ? Array.from(this.body.entries()) : [];
  }
  cancel() {
    this.abortController.abort();
  }
  async perform() {
    let { fetchOptions: e } = this;
    this.delegate.prepareRequest(this), await this.#b(e);
    try {
      this.delegate.requestStarted(this);
      let t = await fetchWithTurboHeaders(this.url.href, e);
      return await this.receive(t);
    } catch (r) {
      if ("AbortError" !== r.name)
        throw (this.#c(r) && this.delegate.requestErrored(this, r), r);
    } finally {
      this.delegate.requestFinished(this);
    }
  }
  async receive(e) {
    let t = new FetchResponse(e),
      r = dispatch("turbo:before-fetch-response", {
        cancelable: !0,
        detail: { fetchResponse: t },
        target: this.target,
      });
    return (
      r.defaultPrevented
        ? this.delegate.requestPreventedHandlingResponse(this, t)
        : t.succeeded
        ? this.delegate.requestSucceededWithResponse(this, t)
        : this.delegate.requestFailedWithResponse(this, t),
      t
    );
  }
  get defaultHeaders() {
    return { Accept: "text/html, application/xhtml+xml" };
  }
  get isSafe() {
    return isSafe(this.method);
  }
  get abortSignal() {
    return this.abortController.signal;
  }
  acceptResponseType(e) {
    this.headers.Accept = [e, this.headers.Accept].join(", ");
  }
  async #b(e) {
    let t = new Promise((e) => (this.#a = e)),
      r = dispatch("turbo:before-fetch-request", {
        cancelable: !0,
        detail: { fetchOptions: e, url: this.url, resume: this.#a },
        target: this.target,
      });
    (this.url = r.detail.url), r.defaultPrevented && (await t);
  }
  #c(i) {
    let s = dispatch("turbo:fetch-request-error", {
      target: this.target,
      cancelable: !0,
      detail: { request: this, error: i },
    });
    return !s.defaultPrevented;
  }
}
function isSafe(e) {
  return fetchMethodFromString(e) == FetchMethod.get;
}
function buildResourceAndBody(e, t, r, i) {
  let s =
    Array.from(r).length > 0
      ? new URLSearchParams(entriesExcludingFiles(r))
      : e.searchParams;
  return isSafe(t)
    ? [mergeIntoURLSearchParams(e, s), null]
    : i == FetchEnctype.urlEncoded
    ? [e, s]
    : [e, r];
}
function entriesExcludingFiles(e) {
  let t = [];
  for (let [r, i] of e) !(i instanceof File) && t.push([r, i]);
  return t;
}
function mergeIntoURLSearchParams(e, t) {
  let r = new URLSearchParams(entriesExcludingFiles(t));
  return (e.search = r.toString()), e;
}
class AppearanceObserver {
  started = !1;
  constructor(e, t) {
    (this.delegate = e),
      (this.element = t),
      (this.intersectionObserver = new IntersectionObserver(this.intersect));
  }
  start() {
    this.started ||
      ((this.started = !0), this.intersectionObserver.observe(this.element));
  }
  stop() {
    this.started &&
      ((this.started = !1), this.intersectionObserver.unobserve(this.element));
  }
  intersect = (e) => {
    let t = e.slice(-1)[0];
    t?.isIntersecting && this.delegate.elementAppearedInViewport(this.element);
  };
}
class StreamMessage {
  static contentType = "text/vnd.turbo-stream.html";
  static wrap(e) {
    return "string" == typeof e ? new this(createDocumentFragment(e)) : e;
  }
  constructor(e) {
    this.fragment = importStreamElements(e);
  }
}
function importStreamElements(e) {
  for (let t of e.querySelectorAll("turbo-stream")) {
    let r = document.importNode(t, !0);
    for (let i of r.templateElement.content.querySelectorAll("script"))
      i.replaceWith(activateScriptElement(i));
    t.replaceWith(r);
  }
  return e;
}
let FormSubmissionState = {
  initialized: "initialized",
  requesting: "requesting",
  waiting: "waiting",
  receiving: "receiving",
  stopping: "stopping",
  stopped: "stopped",
};
class FormSubmission {
  state = FormSubmissionState.initialized;
  static confirmMethod(e, t, r) {
    return Promise.resolve(confirm(e));
  }
  constructor(e, t, r, i = !1) {
    let s = getMethod(t, r),
      n = getAction(getFormAction(t, r), s),
      o = buildFormData(t, r),
      a = getEnctype(t, r);
    (this.delegate = e),
      (this.formElement = t),
      (this.submitter = r),
      (this.fetchRequest = new FetchRequest(this, s, n, o, t, a)),
      (this.mustRedirect = i);
  }
  get method() {
    return this.fetchRequest.method;
  }
  set method(e) {
    this.fetchRequest.method = e;
  }
  get action() {
    return this.fetchRequest.url.toString();
  }
  set action(e) {
    this.fetchRequest.url = expandURL(e);
  }
  get body() {
    return this.fetchRequest.body;
  }
  get enctype() {
    return this.fetchRequest.enctype;
  }
  get isSafe() {
    return this.fetchRequest.isSafe;
  }
  get location() {
    return this.fetchRequest.url;
  }
  async start() {
    let { initialized: e, requesting: t } = FormSubmissionState,
      r = getAttribute("data-turbo-confirm", this.submitter, this.formElement);
    if ("string" == typeof r) {
      let i = await FormSubmission.confirmMethod(
        r,
        this.formElement,
        this.submitter
      );
      if (!i) return;
    }
    if (this.state == e) return (this.state = t), this.fetchRequest.perform();
  }
  stop() {
    let { stopping: e, stopped: t } = FormSubmissionState;
    if (this.state != e && this.state != t)
      return (this.state = e), this.fetchRequest.cancel(), !0;
  }
  prepareRequest(e) {
    if (!e.isSafe) {
      let t =
        getCookieValue(getMetaContent("csrf-param")) ||
        getMetaContent("csrf-token");
      t && (e.headers["X-CSRF-Token"] = t);
    }
    this.requestAcceptsTurboStreamResponse(e) &&
      e.acceptResponseType(StreamMessage.contentType);
  }
  requestStarted(e) {
    (this.state = FormSubmissionState.waiting),
      this.submitter?.setAttribute("disabled", ""),
      this.setSubmitsWith(),
      markAsBusy(this.formElement),
      dispatch("turbo:submit-start", {
        target: this.formElement,
        detail: { formSubmission: this },
      }),
      this.delegate.formSubmissionStarted(this);
  }
  requestPreventedHandlingResponse(e, t) {
    this.result = { success: t.succeeded, fetchResponse: t };
  }
  requestSucceededWithResponse(e, t) {
    if (t.clientError || t.serverError)
      this.delegate.formSubmissionFailedWithResponse(this, t);
    else if (
      this.requestMustRedirect(e) &&
      responseSucceededWithoutRedirect(t)
    ) {
      let r = Error("Form responses must redirect to another location");
      this.delegate.formSubmissionErrored(this, r);
    } else
      (this.state = FormSubmissionState.receiving),
        (this.result = { success: !0, fetchResponse: t }),
        this.delegate.formSubmissionSucceededWithResponse(this, t);
  }
  requestFailedWithResponse(e, t) {
    (this.result = { success: !1, fetchResponse: t }),
      this.delegate.formSubmissionFailedWithResponse(this, t);
  }
  requestErrored(e, t) {
    (this.result = { success: !1, error: t }),
      this.delegate.formSubmissionErrored(this, t);
  }
  requestFinished(e) {
    (this.state = FormSubmissionState.stopped),
      this.submitter?.removeAttribute("disabled"),
      this.resetSubmitterText(),
      clearBusyState(this.formElement),
      dispatch("turbo:submit-end", {
        target: this.formElement,
        detail: { formSubmission: this, ...this.result },
      }),
      this.delegate.formSubmissionFinished(this);
  }
  setSubmitsWith() {
    if (this.submitter && this.submitsWith) {
      if (this.submitter.matches("button"))
        (this.originalSubmitText = this.submitter.innerHTML),
          (this.submitter.innerHTML = this.submitsWith);
      else if (this.submitter.matches("input")) {
        let e = this.submitter;
        (this.originalSubmitText = e.value), (e.value = this.submitsWith);
      }
    }
  }
  resetSubmitterText() {
    if (this.submitter && this.originalSubmitText) {
      if (this.submitter.matches("button"))
        this.submitter.innerHTML = this.originalSubmitText;
      else if (this.submitter.matches("input")) {
        let e = this.submitter;
        e.value = this.originalSubmitText;
      }
    }
  }
  requestMustRedirect(e) {
    return !e.isSafe && this.mustRedirect;
  }
  requestAcceptsTurboStreamResponse(e) {
    return (
      !e.isSafe ||
      hasAttribute("data-turbo-stream", this.submitter, this.formElement)
    );
  }
  get submitsWith() {
    return this.submitter?.getAttribute("data-turbo-submits-with");
  }
}
function buildFormData(e, t) {
  let r = new FormData(e),
    i = t?.getAttribute("name"),
    s = t?.getAttribute("value");
  return i && r.append(i, s || ""), r;
}
function getCookieValue(e) {
  if (null != e) {
    let t = document.cookie ? document.cookie.split("; ") : [],
      r = t.find((t) => t.startsWith(e));
    if (r) {
      let i = r.split("=").slice(1).join("=");
      return i ? decodeURIComponent(i) : void 0;
    }
  }
}
function responseSucceededWithoutRedirect(e) {
  return 200 == e.statusCode && !e.redirected;
}
function getFormAction(e, t) {
  let r = "string" == typeof e.action ? e.action : null;
  return t?.hasAttribute("formaction")
    ? t.getAttribute("formaction") || ""
    : e.getAttribute("action") || r || "";
}
function getAction(e, t) {
  let r = expandURL(e);
  return isSafe(t) && (r.search = ""), r;
}
function getMethod(e, t) {
  let r = t?.getAttribute("formmethod") || e.getAttribute("method") || "";
  return fetchMethodFromString(r.toLowerCase()) || FetchMethod.get;
}
function getEnctype(e, t) {
  return fetchEnctypeFromString(t?.getAttribute("formenctype") || e.enctype);
}
class Snapshot {
  constructor(e) {
    this.element = e;
  }
  get activeElement() {
    return this.element.ownerDocument.activeElement;
  }
  get children() {
    return [...this.element.children];
  }
  hasAnchor(e) {
    return null != this.getElementForAnchor(e);
  }
  getElementForAnchor(e) {
    return e ? this.element.querySelector(`[id='${e}'], a[name='${e}']`) : null;
  }
  get isConnected() {
    return this.element.isConnected;
  }
  get firstAutofocusableElement() {
    return queryAutofocusableElement(this.element);
  }
  get permanentElements() {
    return queryPermanentElementsAll(this.element);
  }
  getPermanentElementById(e) {
    return getPermanentElementById(this.element, e);
  }
  getPermanentElementMapForSnapshot(e) {
    let t = {};
    for (let r of this.permanentElements) {
      let { id: i } = r,
        s = e.getPermanentElementById(i);
      s && (t[i] = [r, s]);
    }
    return t;
  }
}
function getPermanentElementById(e, t) {
  return e.querySelector(`#${t}[data-turbo-permanent]`);
}
function queryPermanentElementsAll(e) {
  return e.querySelectorAll("[id][data-turbo-permanent]");
}
class FormSubmitObserver {
  started = !1;
  constructor(e, t) {
    (this.delegate = e), (this.eventTarget = t);
  }
  start() {
    this.started ||
      (this.eventTarget.addEventListener("submit", this.submitCaptured, !0),
      (this.started = !0));
  }
  stop() {
    this.started &&
      (this.eventTarget.removeEventListener("submit", this.submitCaptured, !0),
      (this.started = !1));
  }
  submitCaptured = () => {
    this.eventTarget.removeEventListener("submit", this.submitBubbled, !1),
      this.eventTarget.addEventListener("submit", this.submitBubbled, !1);
  };
  submitBubbled = (e) => {
    if (!e.defaultPrevented) {
      let t = e.target instanceof HTMLFormElement ? e.target : void 0,
        r = e.submitter || void 0;
      t &&
        submissionDoesNotDismissDialog(t, r) &&
        submissionDoesNotTargetIFrame(t, r) &&
        this.delegate.willSubmitForm(t, r) &&
        (e.preventDefault(),
        e.stopImmediatePropagation(),
        this.delegate.formSubmitted(t, r));
    }
  };
}
function submissionDoesNotDismissDialog(e, t) {
  let r = t?.getAttribute("formmethod") || e.getAttribute("method");
  return "dialog" != r;
}
function submissionDoesNotTargetIFrame(e, t) {
  if (!(t?.hasAttribute("formtarget") || e.hasAttribute("target"))) return !0;
  {
    let r = t?.getAttribute("formtarget") || e.target;
    for (let i of document.getElementsByName(r))
      if (i instanceof HTMLIFrameElement) return !1;
    return !0;
  }
}
class View {
  #d = (e) => {};
  #e = (e) => {};
  constructor(e, t) {
    (this.delegate = e), (this.element = t);
  }
  scrollToAnchor(e) {
    let t = this.snapshot.getElementForAnchor(e);
    t
      ? (this.scrollToElement(t), this.focusElement(t))
      : this.scrollToPosition({ x: 0, y: 0 });
  }
  scrollToAnchorFromLocation(e) {
    this.scrollToAnchor(getAnchor(e));
  }
  scrollToElement(e) {
    e.scrollIntoView();
  }
  focusElement(e) {
    e instanceof HTMLElement &&
      (e.hasAttribute("tabindex")
        ? e.focus()
        : (e.setAttribute("tabindex", "-1"),
          e.focus(),
          e.removeAttribute("tabindex")));
  }
  scrollToPosition({ x: e, y: t }) {
    this.scrollRoot.scrollTo(e, t);
  }
  scrollToTop() {
    this.scrollToPosition({ x: 0, y: 0 });
  }
  get scrollRoot() {
    return window;
  }
  async render(e) {
    let { isPreview: t, shouldRender: r, newSnapshot: i } = e;
    if (r)
      try {
        (this.renderPromise = new Promise((e) => (this.#d = e))),
          (this.renderer = e),
          await this.prepareToRenderSnapshot(e);
        let s = new Promise((e) => (this.#e = e)),
          n = { resume: this.#e, render: this.renderer.renderElement },
          o = this.delegate.allowsImmediateRender(i, t, n);
        o || (await s),
          await this.renderSnapshot(e),
          this.delegate.viewRenderedSnapshot(i, t, this.renderer.renderMethod),
          this.delegate.preloadOnLoadLinksForView(this.element),
          this.finishRenderingSnapshot(e);
      } finally {
        delete this.renderer, this.#d(void 0), delete this.renderPromise;
      }
    else this.invalidate(e.reloadReason);
  }
  invalidate(e) {
    this.delegate.viewInvalidated(e);
  }
  async prepareToRenderSnapshot(e) {
    this.markAsPreview(e.isPreview), await e.prepareToRender();
  }
  markAsPreview(e) {
    e
      ? this.element.setAttribute("data-turbo-preview", "")
      : this.element.removeAttribute("data-turbo-preview");
  }
  markVisitDirection(e) {
    this.element.setAttribute("data-turbo-visit-direction", e);
  }
  unmarkVisitDirection() {
    this.element.removeAttribute("data-turbo-visit-direction");
  }
  async renderSnapshot(e) {
    await e.render();
  }
  finishRenderingSnapshot(e) {
    e.finishRendering();
  }
}
class FrameView extends View {
  missing() {
    this.element.innerHTML =
      '<strong class="turbo-frame-error">Content missing</strong>';
  }
  get snapshot() {
    return new Snapshot(this.element);
  }
}
class LinkInterceptor {
  constructor(e, t) {
    (this.delegate = e), (this.element = t);
  }
  start() {
    this.element.addEventListener("click", this.clickBubbled),
      document.addEventListener("turbo:click", this.linkClicked),
      document.addEventListener("turbo:before-visit", this.willVisit);
  }
  stop() {
    this.element.removeEventListener("click", this.clickBubbled),
      document.removeEventListener("turbo:click", this.linkClicked),
      document.removeEventListener("turbo:before-visit", this.willVisit);
  }
  clickBubbled = (e) => {
    this.respondsToEventTarget(e.target)
      ? (this.clickEvent = e)
      : delete this.clickEvent;
  };
  linkClicked = (e) => {
    this.clickEvent &&
      this.respondsToEventTarget(e.target) &&
      e.target instanceof Element &&
      this.delegate.shouldInterceptLinkClick(
        e.target,
        e.detail.url,
        e.detail.originalEvent
      ) &&
      (this.clickEvent.preventDefault(),
      e.preventDefault(),
      this.delegate.linkClickIntercepted(
        e.target,
        e.detail.url,
        e.detail.originalEvent
      )),
      delete this.clickEvent;
  };
  willVisit = (e) => {
    delete this.clickEvent;
  };
  respondsToEventTarget(e) {
    let t =
      e instanceof Element ? e : e instanceof Node ? e.parentElement : null;
    return t && t.closest("turbo-frame, html") == this.element;
  }
}
class LinkClickObserver {
  started = !1;
  constructor(e, t) {
    (this.delegate = e), (this.eventTarget = t);
  }
  start() {
    this.started ||
      (this.eventTarget.addEventListener("click", this.clickCaptured, !0),
      (this.started = !0));
  }
  stop() {
    this.started &&
      (this.eventTarget.removeEventListener("click", this.clickCaptured, !0),
      (this.started = !1));
  }
  clickCaptured = () => {
    this.eventTarget.removeEventListener("click", this.clickBubbled, !1),
      this.eventTarget.addEventListener("click", this.clickBubbled, !1);
  };
  clickBubbled = (e) => {
    if (e instanceof MouseEvent && this.clickEventIsSignificant(e)) {
      let t = (e.composedPath && e.composedPath()[0]) || e.target,
        r = this.findLinkFromClickTarget(t);
      if (r && doesNotTargetIFrame(r)) {
        let i = this.getLocationForLink(r);
        this.delegate.willFollowLinkToLocation(r, i, e) &&
          (e.preventDefault(), this.delegate.followedLinkToLocation(r, i));
      }
    }
  };
  clickEventIsSignificant(e) {
    return !(
      (e.target && e.target.isContentEditable) ||
      e.defaultPrevented ||
      e.which > 1 ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey
    );
  }
  findLinkFromClickTarget(e) {
    return findClosestRecursively(
      e,
      "a[href]:not([target^=_]):not([download])"
    );
  }
  getLocationForLink(e) {
    return expandURL(e.getAttribute("href") || "");
  }
}
function doesNotTargetIFrame(e) {
  if (!e.hasAttribute("target")) return !0;
  for (let t of document.getElementsByName(e.target))
    if (t instanceof HTMLIFrameElement) return !1;
  return !0;
}
class FormLinkClickObserver {
  constructor(e, t) {
    (this.delegate = e),
      (this.linkInterceptor = new LinkClickObserver(this, t));
  }
  start() {
    this.linkInterceptor.start();
  }
  stop() {
    this.linkInterceptor.stop();
  }
  willFollowLinkToLocation(e, t, r) {
    return (
      this.delegate.willSubmitFormLinkToLocation(e, t, r) &&
      (e.hasAttribute("data-turbo-method") ||
        e.hasAttribute("data-turbo-stream"))
    );
  }
  followedLinkToLocation(e, t) {
    let r = document.createElement("form");
    for (let [i, s] of t.searchParams)
      r.append(
        Object.assign(document.createElement("input"), {
          type: "hidden",
          name: i,
          value: s,
        })
      );
    let n = Object.assign(t, { search: "" });
    r.setAttribute("data-turbo", "true"),
      r.setAttribute("action", n.href),
      r.setAttribute("hidden", "");
    let o = e.getAttribute("data-turbo-method");
    o && r.setAttribute("method", o);
    let a = e.getAttribute("data-turbo-frame");
    a && r.setAttribute("data-turbo-frame", a);
    let l = getVisitAction(e);
    l && r.setAttribute("data-turbo-action", l);
    let h = e.getAttribute("data-turbo-confirm");
    h && r.setAttribute("data-turbo-confirm", h);
    let c = e.hasAttribute("data-turbo-stream");
    c && r.setAttribute("data-turbo-stream", ""),
      this.delegate.submittedFormLinkToLocation(e, t, r),
      document.body.appendChild(r),
      r.addEventListener("turbo:submit-end", () => r.remove(), { once: !0 }),
      requestAnimationFrame(() => r.requestSubmit());
  }
}
class Bardo {
  static async preservingPermanentElements(e, t, r) {
    let i = new this(e, t);
    i.enter(), await r(), i.leave();
  }
  constructor(e, t) {
    (this.delegate = e), (this.permanentElementMap = t);
  }
  enter() {
    for (let e in this.permanentElementMap) {
      let [t, r] = this.permanentElementMap[e];
      this.delegate.enteringBardo(t, r),
        this.replaceNewPermanentElementWithPlaceholder(r);
    }
  }
  leave() {
    for (let e in this.permanentElementMap) {
      let [t] = this.permanentElementMap[e];
      this.replaceCurrentPermanentElementWithClone(t),
        this.replacePlaceholderWithPermanentElement(t),
        this.delegate.leavingBardo(t);
    }
  }
  replaceNewPermanentElementWithPlaceholder(e) {
    let t = createPlaceholderForPermanentElement(e);
    e.replaceWith(t);
  }
  replaceCurrentPermanentElementWithClone(e) {
    let t = e.cloneNode(!0);
    e.replaceWith(t);
  }
  replacePlaceholderWithPermanentElement(e) {
    let t = this.getPlaceholderById(e.id);
    t?.replaceWith(e);
  }
  getPlaceholderById(e) {
    return this.placeholders.find((t) => t.content == e);
  }
  get placeholders() {
    return [
      ...document.querySelectorAll(
        "meta[name=turbo-permanent-placeholder][content]"
      ),
    ];
  }
}
function createPlaceholderForPermanentElement(e) {
  let t = document.createElement("meta");
  return (
    t.setAttribute("name", "turbo-permanent-placeholder"),
    t.setAttribute("content", e.id),
    t
  );
}
class Renderer {
  #f = null;
  constructor(e, t, r, i, s = !0) {
    (this.currentSnapshot = e),
      (this.newSnapshot = t),
      (this.isPreview = i),
      (this.willRender = s),
      (this.renderElement = r),
      (this.promise = new Promise(
        (e, t) => (this.resolvingFunctions = { resolve: e, reject: t })
      ));
  }
  get shouldRender() {
    return !0;
  }
  get reloadReason() {}
  prepareToRender() {}
  render() {}
  finishRendering() {
    this.resolvingFunctions &&
      (this.resolvingFunctions.resolve(), delete this.resolvingFunctions);
  }
  async preservingPermanentElements(e) {
    await Bardo.preservingPermanentElements(this, this.permanentElementMap, e);
  }
  focusFirstAutofocusableElement() {
    let e = this.connectedSnapshot.firstAutofocusableElement;
    e && e.focus();
  }
  enteringBardo(e) {
    !this.#f &&
      e.contains(this.currentSnapshot.activeElement) &&
      (this.#f = this.currentSnapshot.activeElement);
  }
  leavingBardo(e) {
    e.contains(this.#f) &&
      this.#f instanceof HTMLElement &&
      (this.#f.focus(), (this.#f = null));
  }
  get connectedSnapshot() {
    return this.newSnapshot.isConnected
      ? this.newSnapshot
      : this.currentSnapshot;
  }
  get currentElement() {
    return this.currentSnapshot.element;
  }
  get newElement() {
    return this.newSnapshot.element;
  }
  get permanentElementMap() {
    return this.currentSnapshot.getPermanentElementMapForSnapshot(
      this.newSnapshot
    );
  }
  get renderMethod() {
    return "replace";
  }
}
class FrameRenderer extends Renderer {
  static renderElement(e, t) {
    let r = document.createRange();
    r.selectNodeContents(e), r.deleteContents();
    let i = t,
      s = i.ownerDocument?.createRange();
    s && (s.selectNodeContents(i), e.appendChild(s.extractContents()));
  }
  constructor(e, t, r, i, s, n = !0) {
    super(t, r, i, s, n), (this.delegate = e);
  }
  get shouldRender() {
    return !0;
  }
  async render() {
    await nextRepaint(),
      this.preservingPermanentElements(() => {
        this.loadFrameElement();
      }),
      this.scrollFrameIntoView(),
      await nextRepaint(),
      this.focusFirstAutofocusableElement(),
      await nextRepaint(),
      this.activateScriptElements();
  }
  loadFrameElement() {
    this.delegate.willRenderFrame(this.currentElement, this.newElement),
      this.renderElement(this.currentElement, this.newElement);
  }
  scrollFrameIntoView() {
    if (this.currentElement.autoscroll || this.newElement.autoscroll) {
      let e = this.currentElement.firstElementChild,
        t = readScrollLogicalPosition(
          this.currentElement.getAttribute("data-autoscroll-block"),
          "end"
        ),
        r = readScrollBehavior(
          this.currentElement.getAttribute("data-autoscroll-behavior"),
          "auto"
        );
      if (e) return e.scrollIntoView({ block: t, behavior: r }), !0;
    }
    return !1;
  }
  activateScriptElements() {
    for (let e of this.newScriptElements) {
      let t = activateScriptElement(e);
      e.replaceWith(t);
    }
  }
  get newScriptElements() {
    return this.currentElement.querySelectorAll("script");
  }
}
function readScrollLogicalPosition(e, t) {
  return "end" == e || "start" == e || "center" == e || "nearest" == e ? e : t;
}
function readScrollBehavior(e, t) {
  return "auto" == e || "smooth" == e ? e : t;
}
class ProgressBar {
  static animationDuration = 300;
  static get defaultCSS() {
    return unindent`
.turbo-progress-bar {
  position: fixed;
  display: block;
  top: 0;
  left: 0;
  height: 3px;
  background: #0076ff;
  z-index: 2147483647;
  transition:
    width ${ProgressBar.animationDuration}ms ease-out,
    opacity ${ProgressBar.animationDuration / 2}ms ${
      ProgressBar.animationDuration / 2
    }ms ease-in;
  transform: translate3d(0, 0, 0);
}
`;
  }
  hiding = !1;
  value = 0;
  visible = !1;
  constructor() {
    (this.stylesheetElement = this.createStylesheetElement()),
      (this.progressElement = this.createProgressElement()),
      this.installStylesheetElement(),
      this.setValue(0);
  }
  show() {
    this.visible ||
      ((this.visible = !0),
      this.installProgressElement(),
      this.startTrickling());
  }
  hide() {
    this.visible &&
      !this.hiding &&
      ((this.hiding = !0),
      this.fadeProgressElement(() => {
        this.uninstallProgressElement(),
          this.stopTrickling(),
          (this.visible = !1),
          (this.hiding = !1);
      }));
  }
  setValue(e) {
    (this.value = e), this.refresh();
  }
  installStylesheetElement() {
    document.head.insertBefore(
      this.stylesheetElement,
      document.head.firstChild
    );
  }
  installProgressElement() {
    (this.progressElement.style.width = "0"),
      (this.progressElement.style.opacity = "1"),
      document.documentElement.insertBefore(
        this.progressElement,
        document.body
      ),
      this.refresh();
  }
  fadeProgressElement(e) {
    (this.progressElement.style.opacity = "0"),
      setTimeout(e, 1.5 * ProgressBar.animationDuration);
  }
  uninstallProgressElement() {
    this.progressElement.parentNode &&
      document.documentElement.removeChild(this.progressElement);
  }
  startTrickling() {
    this.trickleInterval ||
      (this.trickleInterval = window.setInterval(
        this.trickle,
        ProgressBar.animationDuration
      ));
  }
  stopTrickling() {
    window.clearInterval(this.trickleInterval), delete this.trickleInterval;
  }
  trickle = () => {
    this.setValue(this.value + Math.random() / 100);
  };
  refresh() {
    requestAnimationFrame(() => {
      this.progressElement.style.width = `${10 + 90 * this.value}%`;
    });
  }
  createStylesheetElement() {
    let e = document.createElement("style");
    return (
      (e.type = "text/css"),
      (e.textContent = ProgressBar.defaultCSS),
      this.cspNonce && (e.nonce = this.cspNonce),
      e
    );
  }
  createProgressElement() {
    let e = document.createElement("div");
    return (e.className = "turbo-progress-bar"), e;
  }
  get cspNonce() {
    return getMetaContent("csp-nonce");
  }
}
class HeadSnapshot extends Snapshot {
  detailsByOuterHTML = this.children
    .filter((e) => !elementIsNoscript(e))
    .map((e) => elementWithoutNonce(e))
    .reduce((e, t) => {
      let { outerHTML: r } = t,
        i =
          r in e
            ? e[r]
            : {
                type: elementType(t),
                tracked: elementIsTracked(t),
                elements: [],
              };
      return { ...e, [r]: { ...i, elements: [...i.elements, t] } };
    }, {});
  get trackedElementSignature() {
    return Object.keys(this.detailsByOuterHTML)
      .filter((e) => this.detailsByOuterHTML[e].tracked)
      .join("");
  }
  getScriptElementsNotInSnapshot(e) {
    return this.getElementsMatchingTypeNotInSnapshot("script", e);
  }
  getStylesheetElementsNotInSnapshot(e) {
    return this.getElementsMatchingTypeNotInSnapshot("stylesheet", e);
  }
  getElementsMatchingTypeNotInSnapshot(e, t) {
    return Object.keys(this.detailsByOuterHTML)
      .filter((e) => !(e in t.detailsByOuterHTML))
      .map((e) => this.detailsByOuterHTML[e])
      .filter(({ type: t }) => t == e)
      .map(({ elements: [e] }) => e);
  }
  get provisionalElements() {
    return Object.keys(this.detailsByOuterHTML).reduce((e, t) => {
      let { type: r, tracked: i, elements: s } = this.detailsByOuterHTML[t];
      return null != r || i
        ? s.length > 1
          ? [...e, ...s.slice(1)]
          : e
        : [...e, ...s];
    }, []);
  }
  getMetaValue(e) {
    let t = this.findMetaElementByName(e);
    return t ? t.getAttribute("content") : null;
  }
  findMetaElementByName(e) {
    return Object.keys(this.detailsByOuterHTML).reduce((t, r) => {
      let {
        elements: [i],
      } = this.detailsByOuterHTML[r];
      return elementIsMetaElementWithName(i, e) ? i : t;
    }, 0);
  }
}
function elementType(e) {
  return elementIsScript(e)
    ? "script"
    : elementIsStylesheet(e)
    ? "stylesheet"
    : void 0;
}
function elementIsTracked(e) {
  return "reload" == e.getAttribute("data-turbo-track");
}
function elementIsScript(e) {
  let t = e.localName;
  return "script" == t;
}
function elementIsNoscript(e) {
  let t = e.localName;
  return "noscript" == t;
}
function elementIsStylesheet(e) {
  let t = e.localName;
  return "style" == t || ("link" == t && "stylesheet" == e.getAttribute("rel"));
}
function elementIsMetaElementWithName(e, t) {
  let r = e.localName;
  return "meta" == r && e.getAttribute("name") == t;
}
function elementWithoutNonce(e) {
  return e.hasAttribute("nonce") && e.setAttribute("nonce", ""), e;
}
class PageSnapshot extends Snapshot {
  static fromHTMLString(e = "") {
    return this.fromDocument(parseHTMLDocument(e));
  }
  static fromElement(e) {
    return this.fromDocument(e.ownerDocument);
  }
  static fromDocument({ documentElement: e, body: t, head: r }) {
    return new this(e, t, new HeadSnapshot(r));
  }
  constructor(e, t, r) {
    super(t), (this.documentElement = e), (this.headSnapshot = r);
  }
  clone() {
    let e = this.element.cloneNode(!0),
      t = this.element.querySelectorAll("select"),
      r = e.querySelectorAll("select");
    for (let [i, s] of t.entries()) {
      let n = r[i];
      for (let o of n.selectedOptions) o.selected = !1;
      for (let a of s.selectedOptions) n.options[a.index].selected = !0;
    }
    for (let l of e.querySelectorAll('input[type="password"]')) l.value = "";
    return new PageSnapshot(this.documentElement, e, this.headSnapshot);
  }
  get lang() {
    return this.documentElement.getAttribute("lang");
  }
  get headElement() {
    return this.headSnapshot.element;
  }
  get rootLocation() {
    let e = this.getSetting("root") ?? "/";
    return expandURL(e);
  }
  get cacheControlValue() {
    return this.getSetting("cache-control");
  }
  get isPreviewable() {
    return "no-preview" != this.cacheControlValue;
  }
  get isCacheable() {
    return "no-cache" != this.cacheControlValue;
  }
  get isVisitable() {
    return "reload" != this.getSetting("visit-control");
  }
  get prefersViewTransitions() {
    return "same-origin" === this.headSnapshot.getMetaValue("view-transition");
  }
  get shouldMorphPage() {
    return "morph" === this.getSetting("refresh-method");
  }
  get shouldPreserveScrollPosition() {
    return "preserve" === this.getSetting("refresh-scroll");
  }
  getSetting(e) {
    return this.headSnapshot.getMetaValue(`turbo-${e}`);
  }
}
class ViewTransitioner {
  #g = !1;
  #h = Promise.resolve();
  renderChange(e, t) {
    return (
      e && this.viewTransitionsAvailable && !this.#g
        ? ((this.#g = !0),
          (this.#h = this.#h.then(async () => {
            await document.startViewTransition(t).finished;
          })))
        : (this.#h = this.#h.then(t)),
      this.#h
    );
  }
  get viewTransitionsAvailable() {
    return document.startViewTransition;
  }
}
let defaultOptions = {
    action: "advance",
    historyChanged: !1,
    visitCachedSnapshot() {},
    willRender: !0,
    updateHistory: !0,
    shouldCacheSnapshot: !0,
    acceptsStreamResponse: !1,
  },
  TimingMetric = {
    visitStart: "visitStart",
    requestStart: "requestStart",
    requestEnd: "requestEnd",
    visitEnd: "visitEnd",
  },
  VisitState = {
    initialized: "initialized",
    started: "started",
    canceled: "canceled",
    failed: "failed",
    completed: "completed",
  },
  SystemStatusCode = {
    networkFailure: 0,
    timeoutFailure: -1,
    contentTypeMismatch: -2,
  },
  Direction = { advance: "forward", restore: "back", replace: "none" };
class Visit {
  identifier = uuid();
  timingMetrics = {};
  followedRedirect = !1;
  historyChanged = !1;
  scrolled = !1;
  shouldCacheSnapshot = !0;
  acceptsStreamResponse = !1;
  snapshotCached = !1;
  state = VisitState.initialized;
  viewTransitioner = new ViewTransitioner();
  constructor(e, t, r, i = {}) {
    (this.delegate = e),
      (this.location = t),
      (this.restorationIdentifier = r || uuid());
    let {
      action: s,
      historyChanged: n,
      referrer: o,
      snapshot: a,
      snapshotHTML: l,
      response: h,
      visitCachedSnapshot: c,
      willRender: d,
      updateHistory: u,
      shouldCacheSnapshot: m,
      acceptsStreamResponse: p,
      direction: g,
    } = { ...defaultOptions, ...i };
    (this.action = s),
      (this.historyChanged = n),
      (this.referrer = o),
      (this.snapshot = a),
      (this.snapshotHTML = l),
      (this.response = h),
      (this.isSamePage = this.delegate.locationWithActionIsSamePage(
        this.location,
        this.action
      )),
      (this.visitCachedSnapshot = c),
      (this.willRender = d),
      (this.updateHistory = u),
      (this.scrolled = !d),
      (this.shouldCacheSnapshot = m),
      (this.acceptsStreamResponse = p),
      (this.direction = g || Direction[s]);
  }
  get adapter() {
    return this.delegate.adapter;
  }
  get view() {
    return this.delegate.view;
  }
  get history() {
    return this.delegate.history;
  }
  get restorationData() {
    return this.history.getRestorationDataForIdentifier(
      this.restorationIdentifier
    );
  }
  get silent() {
    return this.isSamePage;
  }
  start() {
    this.state == VisitState.initialized &&
      (this.recordTimingMetric(TimingMetric.visitStart),
      (this.state = VisitState.started),
      this.adapter.visitStarted(this),
      this.delegate.visitStarted(this));
  }
  cancel() {
    this.state == VisitState.started &&
      (this.request && this.request.cancel(),
      this.cancelRender(),
      (this.state = VisitState.canceled));
  }
  complete() {
    this.state != VisitState.started ||
      (this.recordTimingMetric(TimingMetric.visitEnd),
      (this.state = VisitState.completed),
      this.followRedirect(),
      this.followedRedirect ||
        (this.adapter.visitCompleted(this),
        this.delegate.visitCompleted(this)));
  }
  fail() {
    this.state == VisitState.started &&
      ((this.state = VisitState.failed),
      this.adapter.visitFailed(this),
      this.delegate.visitCompleted(this));
  }
  changeHistory() {
    if (!this.historyChanged && this.updateHistory) {
      let e =
          this.location.href === this.referrer?.href ? "replace" : this.action,
        t = getHistoryMethodForAction(e);
      this.history.update(t, this.location, this.restorationIdentifier),
        (this.historyChanged = !0);
    }
  }
  issueRequest() {
    this.hasPreloadedResponse()
      ? this.simulateRequest()
      : this.shouldIssueRequest() &&
        !this.request &&
        ((this.request = new FetchRequest(
          this,
          FetchMethod.get,
          this.location
        )),
        this.request.perform());
  }
  simulateRequest() {
    this.response &&
      (this.startRequest(), this.recordResponse(), this.finishRequest());
  }
  startRequest() {
    this.recordTimingMetric(TimingMetric.requestStart),
      this.adapter.visitRequestStarted(this);
  }
  recordResponse(e = this.response) {
    if (((this.response = e), e)) {
      let { statusCode: t } = e;
      isSuccessful(t)
        ? this.adapter.visitRequestCompleted(this)
        : this.adapter.visitRequestFailedWithStatusCode(this, t);
    }
  }
  finishRequest() {
    this.recordTimingMetric(TimingMetric.requestEnd),
      this.adapter.visitRequestFinished(this);
  }
  loadResponse() {
    if (this.response) {
      let { statusCode: e, responseHTML: t } = this.response;
      this.render(async () => {
        if (
          (this.shouldCacheSnapshot && this.cacheSnapshot(),
          this.view.renderPromise && (await this.view.renderPromise),
          isSuccessful(e) && null != t)
        ) {
          let r = PageSnapshot.fromHTMLString(t);
          await this.renderPageSnapshot(r, !1),
            this.adapter.visitRendered(this),
            this.complete();
        } else
          await this.view.renderError(PageSnapshot.fromHTMLString(t), this),
            this.adapter.visitRendered(this),
            this.fail();
      });
    }
  }
  getCachedSnapshot() {
    let e =
      this.view.getCachedSnapshotForLocation(this.location) ||
      this.getPreloadedSnapshot();
    if (
      e &&
      (!getAnchor(this.location) || e.hasAnchor(getAnchor(this.location))) &&
      ("restore" == this.action || e.isPreviewable)
    )
      return e;
  }
  getPreloadedSnapshot() {
    if (this.snapshotHTML)
      return PageSnapshot.fromHTMLString(this.snapshotHTML);
  }
  hasCachedSnapshot() {
    return null != this.getCachedSnapshot();
  }
  loadCachedSnapshot() {
    let e = this.getCachedSnapshot();
    if (e) {
      let t = this.shouldIssueRequest();
      this.render(async () => {
        this.cacheSnapshot(),
          this.isSamePage
            ? this.adapter.visitRendered(this)
            : (this.view.renderPromise && (await this.view.renderPromise),
              await this.renderPageSnapshot(e, t),
              this.adapter.visitRendered(this),
              t || this.complete());
      });
    }
  }
  followRedirect() {
    this.redirectedToLocation &&
      !this.followedRedirect &&
      this.response?.redirected &&
      (this.adapter.visitProposedToLocation(this.redirectedToLocation, {
        action: "replace",
        response: this.response,
        shouldCacheSnapshot: !1,
        willRender: !1,
      }),
      (this.followedRedirect = !0));
  }
  goToSamePageAnchor() {
    this.isSamePage &&
      this.render(async () => {
        this.cacheSnapshot(),
          this.performScroll(),
          this.changeHistory(),
          this.adapter.visitRendered(this);
      });
  }
  prepareRequest(e) {
    this.acceptsStreamResponse &&
      e.acceptResponseType(StreamMessage.contentType);
  }
  requestStarted() {
    this.startRequest();
  }
  requestPreventedHandlingResponse(e, t) {}
  async requestSucceededWithResponse(e, t) {
    let r = await t.responseHTML,
      { redirected: i, statusCode: s } = t;
    void 0 == r
      ? this.recordResponse({
          statusCode: SystemStatusCode.contentTypeMismatch,
          redirected: i,
        })
      : ((this.redirectedToLocation = t.redirected ? t.location : void 0),
        this.recordResponse({ statusCode: s, responseHTML: r, redirected: i }));
  }
  async requestFailedWithResponse(e, t) {
    let r = await t.responseHTML,
      { redirected: i, statusCode: s } = t;
    void 0 == r
      ? this.recordResponse({
          statusCode: SystemStatusCode.contentTypeMismatch,
          redirected: i,
        })
      : this.recordResponse({ statusCode: s, responseHTML: r, redirected: i });
  }
  requestErrored(e, t) {
    this.recordResponse({
      statusCode: SystemStatusCode.networkFailure,
      redirected: !1,
    });
  }
  requestFinished() {
    this.finishRequest();
  }
  performScroll() {
    this.scrolled ||
      this.view.forceReloaded ||
      this.view.shouldPreserveScrollPosition(this) ||
      ("restore" == this.action
        ? this.scrollToRestoredPosition() ||
          this.scrollToAnchor() ||
          this.view.scrollToTop()
        : this.scrollToAnchor() || this.view.scrollToTop(),
      this.isSamePage &&
        this.delegate.visitScrolledToSamePageLocation(
          this.view.lastRenderedLocation,
          this.location
        ),
      (this.scrolled = !0));
  }
  scrollToRestoredPosition() {
    let { scrollPosition: e } = this.restorationData;
    if (e) return this.view.scrollToPosition(e), !0;
  }
  scrollToAnchor() {
    let e = getAnchor(this.location);
    if (null != e) return this.view.scrollToAnchor(e), !0;
  }
  recordTimingMetric(e) {
    this.timingMetrics[e] = new Date().getTime();
  }
  getTimingMetrics() {
    return { ...this.timingMetrics };
  }
  getHistoryMethodForAction(e) {
    switch (e) {
      case "replace":
        return history.replaceState;
      case "advance":
      case "restore":
        return history.pushState;
    }
  }
  hasPreloadedResponse() {
    return "object" == typeof this.response;
  }
  shouldIssueRequest() {
    return (
      !this.isSamePage &&
      ("restore" == this.action ? !this.hasCachedSnapshot() : this.willRender)
    );
  }
  cacheSnapshot() {
    this.snapshotCached ||
      (this.view
        .cacheSnapshot(this.snapshot)
        .then((e) => e && this.visitCachedSnapshot(e)),
      (this.snapshotCached = !0));
  }
  async render(e) {
    this.cancelRender(),
      (this.frame = await nextRepaint()),
      await e(),
      delete this.frame;
  }
  async renderPageSnapshot(e, t) {
    await this.viewTransitioner.renderChange(
      this.view.shouldTransitionTo(e),
      async () => {
        await this.view.renderPage(e, t, this.willRender, this),
          this.performScroll();
      }
    );
  }
  cancelRender() {
    this.frame && (cancelAnimationFrame(this.frame), delete this.frame);
  }
}
function isSuccessful(e) {
  return e >= 200 && e < 300;
}
class BrowserAdapter {
  progressBar = new ProgressBar();
  constructor(e) {
    this.session = e;
  }
  visitProposedToLocation(e, t) {
    locationIsVisitable(e, this.navigator.rootLocation)
      ? this.navigator.startVisit(e, t?.restorationIdentifier || uuid(), t)
      : (window.location.href = e.toString());
  }
  visitStarted(e) {
    (this.location = e.location),
      e.loadCachedSnapshot(),
      e.issueRequest(),
      e.goToSamePageAnchor();
  }
  visitRequestStarted(e) {
    this.progressBar.setValue(0),
      e.hasCachedSnapshot() || "restore" != e.action
        ? this.showVisitProgressBarAfterDelay()
        : this.showProgressBar();
  }
  visitRequestCompleted(e) {
    e.loadResponse();
  }
  visitRequestFailedWithStatusCode(e, t) {
    switch (t) {
      case SystemStatusCode.networkFailure:
      case SystemStatusCode.timeoutFailure:
      case SystemStatusCode.contentTypeMismatch:
        return this.reload({
          reason: "request_failed",
          context: { statusCode: t },
        });
      default:
        return e.loadResponse();
    }
  }
  visitRequestFinished(e) {}
  visitCompleted(e) {
    this.progressBar.setValue(1), this.hideVisitProgressBar();
  }
  pageInvalidated(e) {
    this.reload(e);
  }
  visitFailed(e) {
    this.progressBar.setValue(1), this.hideVisitProgressBar();
  }
  visitRendered(e) {}
  formSubmissionStarted(e) {
    this.progressBar.setValue(0), this.showFormProgressBarAfterDelay();
  }
  formSubmissionFinished(e) {
    this.progressBar.setValue(1), this.hideFormProgressBar();
  }
  showVisitProgressBarAfterDelay() {
    this.visitProgressBarTimeout = window.setTimeout(
      this.showProgressBar,
      this.session.progressBarDelay
    );
  }
  hideVisitProgressBar() {
    this.progressBar.hide(),
      null != this.visitProgressBarTimeout &&
        (window.clearTimeout(this.visitProgressBarTimeout),
        delete this.visitProgressBarTimeout);
  }
  showFormProgressBarAfterDelay() {
    null == this.formProgressBarTimeout &&
      (this.formProgressBarTimeout = window.setTimeout(
        this.showProgressBar,
        this.session.progressBarDelay
      ));
  }
  hideFormProgressBar() {
    this.progressBar.hide(),
      null != this.formProgressBarTimeout &&
        (window.clearTimeout(this.formProgressBarTimeout),
        delete this.formProgressBarTimeout);
  }
  showProgressBar = () => {
    this.progressBar.show();
  };
  reload(e) {
    dispatch("turbo:reload", { detail: e }),
      (window.location.href =
        this.location?.toString() || window.location.href);
  }
  get navigator() {
    return this.session.navigator;
  }
}
class CacheObserver {
  selector = "[data-turbo-temporary]";
  deprecatedSelector = "[data-turbo-cache=false]";
  started = !1;
  start() {
    this.started ||
      ((this.started = !0),
      addEventListener("turbo:before-cache", this.removeTemporaryElements, !1));
  }
  stop() {
    this.started &&
      ((this.started = !1),
      removeEventListener(
        "turbo:before-cache",
        this.removeTemporaryElements,
        !1
      ));
  }
  removeTemporaryElements = (e) => {
    for (let t of this.temporaryElements) t.remove();
  };
  get temporaryElements() {
    return [
      ...document.querySelectorAll(this.selector),
      ...this.temporaryElementsWithDeprecation,
    ];
  }
  get temporaryElementsWithDeprecation() {
    let e = document.querySelectorAll(this.deprecatedSelector);
    return (
      e.length &&
        console.warn(
          `The ${this.deprecatedSelector} selector is deprecated and will be removed in a future version. Use ${this.selector} instead.`
        ),
      [...e]
    );
  }
}
class FrameRedirector {
  constructor(e, t) {
    (this.session = e),
      (this.element = t),
      (this.linkInterceptor = new LinkInterceptor(this, t)),
      (this.formSubmitObserver = new FormSubmitObserver(this, t));
  }
  start() {
    this.linkInterceptor.start(), this.formSubmitObserver.start();
  }
  stop() {
    this.linkInterceptor.stop(), this.formSubmitObserver.stop();
  }
  shouldInterceptLinkClick(e, t, r) {
    return this.#i(e);
  }
  linkClickIntercepted(e, t, r) {
    let i = this.#j(e);
    i && i.delegate.linkClickIntercepted(e, t, r);
  }
  willSubmitForm(e, t) {
    return null == e.closest("turbo-frame") && this.#k(e, t) && this.#i(e, t);
  }
  formSubmitted(e, t) {
    let r = this.#j(e, t);
    r && r.delegate.formSubmitted(e, t);
  }
  #k(n, o) {
    let a = getAction$1(n, o),
      l = this.element.ownerDocument.querySelector('meta[name="turbo-root"]'),
      h = expandURL(l?.content ?? "/");
    return this.#i(n, o) && locationIsVisitable(a, h);
  }
  #i(c, d) {
    let u =
      c instanceof HTMLFormElement
        ? this.session.submissionIsNavigatable(c, d)
        : this.session.elementIsNavigatable(c);
    if (!u) return !1;
    {
      let m = this.#j(c, d);
      return !!m && m != c.closest("turbo-frame");
    }
  }
  #j(p, g) {
    let f =
      g?.getAttribute("data-turbo-frame") || p.getAttribute("data-turbo-frame");
    if (f && "_top" != f) {
      let b = this.element.querySelector(`#${f}:not([disabled])`);
      if (b instanceof FrameElement) return b;
    }
  }
}
class History {
  location;
  restorationIdentifier = uuid();
  restorationData = {};
  started = !1;
  pageLoaded = !1;
  currentIndex = 0;
  constructor(e) {
    this.delegate = e;
  }
  start() {
    this.started ||
      (addEventListener("popstate", this.onPopState, !1),
      addEventListener("load", this.onPageLoad, !1),
      (this.currentIndex = history.state?.turbo?.restorationIndex || 0),
      (this.started = !0),
      this.replace(new URL(window.location.href)));
  }
  stop() {
    this.started &&
      (removeEventListener("popstate", this.onPopState, !1),
      removeEventListener("load", this.onPageLoad, !1),
      (this.started = !1));
  }
  push(e, t) {
    this.update(history.pushState, e, t);
  }
  replace(e, t) {
    this.update(history.replaceState, e, t);
  }
  update(e, t, r = uuid()) {
    e === history.pushState && ++this.currentIndex;
    let i = {
      turbo: { restorationIdentifier: r, restorationIndex: this.currentIndex },
    };
    e.call(history, i, "", t.href),
      (this.location = t),
      (this.restorationIdentifier = r);
  }
  getRestorationDataForIdentifier(e) {
    return this.restorationData[e] || {};
  }
  updateRestorationData(e) {
    let { restorationIdentifier: t } = this,
      r = this.restorationData[t];
    this.restorationData[t] = { ...r, ...e };
  }
  assumeControlOfScrollRestoration() {
    this.previousScrollRestoration ||
      ((this.previousScrollRestoration = history.scrollRestoration ?? "auto"),
      (history.scrollRestoration = "manual"));
  }
  relinquishControlOfScrollRestoration() {
    this.previousScrollRestoration &&
      ((history.scrollRestoration = this.previousScrollRestoration),
      delete this.previousScrollRestoration);
  }
  onPopState = (e) => {
    if (this.shouldHandlePopState()) {
      let { turbo: t } = e.state || {};
      if (t) {
        this.location = new URL(window.location.href);
        let { restorationIdentifier: r, restorationIndex: i } = t;
        this.restorationIdentifier = r;
        let s = i > this.currentIndex ? "forward" : "back";
        this.delegate.historyPoppedToLocationWithRestorationIdentifierAndDirection(
          this.location,
          r,
          s
        ),
          (this.currentIndex = i);
      }
    }
  };
  onPageLoad = async (e) => {
    await nextMicrotask(), (this.pageLoaded = !0);
  };
  shouldHandlePopState() {
    return this.pageIsLoaded();
  }
  pageIsLoaded() {
    return this.pageLoaded || "complete" == document.readyState;
  }
}
class Navigator {
  constructor(e) {
    this.delegate = e;
  }
  proposeVisit(e, t = {}) {
    this.delegate.allowsVisitingLocationWithAction(e, t.action) &&
      this.delegate.visitProposedToLocation(e, t);
  }
  startVisit(e, t, r = {}) {
    this.stop(),
      (this.currentVisit = new Visit(this, expandURL(e), t, {
        referrer: this.location,
        ...r,
      })),
      this.currentVisit.start();
  }
  submitForm(e, t) {
    this.stop(),
      (this.formSubmission = new FormSubmission(this, e, t, !0)),
      this.formSubmission.start();
  }
  stop() {
    this.formSubmission &&
      (this.formSubmission.stop(), delete this.formSubmission),
      this.currentVisit &&
        (this.currentVisit.cancel(), delete this.currentVisit);
  }
  get adapter() {
    return this.delegate.adapter;
  }
  get view() {
    return this.delegate.view;
  }
  get rootLocation() {
    return this.view.snapshot.rootLocation;
  }
  get history() {
    return this.delegate.history;
  }
  formSubmissionStarted(e) {
    "function" == typeof this.adapter.formSubmissionStarted &&
      this.adapter.formSubmissionStarted(e);
  }
  async formSubmissionSucceededWithResponse(e, t) {
    if (e == this.formSubmission) {
      let r = await t.responseHTML;
      if (r) {
        let i = e.isSafe;
        i || this.view.clearSnapshotCache();
        let { statusCode: s, redirected: n } = t,
          o = this.#l(e, t);
        this.proposeVisit(t.location, {
          action: o,
          shouldCacheSnapshot: i,
          response: { statusCode: s, responseHTML: r, redirected: n },
        });
      }
    }
  }
  async formSubmissionFailedWithResponse(e, t) {
    let r = await t.responseHTML;
    if (r) {
      let i = PageSnapshot.fromHTMLString(r);
      t.serverError
        ? await this.view.renderError(i, this.currentVisit)
        : await this.view.renderPage(i, !1, !0, this.currentVisit),
        i.shouldPreserveScrollPosition || this.view.scrollToTop(),
        this.view.clearSnapshotCache();
    }
  }
  formSubmissionErrored(e, t) {
    console.error(t);
  }
  formSubmissionFinished(e) {
    "function" == typeof this.adapter.formSubmissionFinished &&
      this.adapter.formSubmissionFinished(e);
  }
  visitStarted(e) {
    this.delegate.visitStarted(e);
  }
  visitCompleted(e) {
    this.delegate.visitCompleted(e);
  }
  locationWithActionIsSamePage(e, t) {
    let r = getAnchor(e),
      i = getAnchor(this.view.lastRenderedLocation);
    return (
      "replace" !== t &&
      getRequestURL(e) === getRequestURL(this.view.lastRenderedLocation) &&
      (("restore" === t && void 0 === r) || (null != r && r !== i))
    );
  }
  visitScrolledToSamePageLocation(e, t) {
    this.delegate.visitScrolledToSamePageLocation(e, t);
  }
  get location() {
    return this.history.location;
  }
  get restorationIdentifier() {
    return this.history.restorationIdentifier;
  }
  #l(S, v) {
    let { submitter: y, formElement: E } = S;
    return getVisitAction(y, E) || this.#m(v);
  }
  #m(w) {
    let R = w.redirected && w.location.href === this.location?.href;
    return R ? "replace" : "advance";
  }
}
let PageStage = { initial: 0, loading: 1, interactive: 2, complete: 3 };
class PageObserver {
  stage = PageStage.initial;
  started = !1;
  constructor(e) {
    this.delegate = e;
  }
  start() {
    this.started ||
      (this.stage == PageStage.initial && (this.stage = PageStage.loading),
      document.addEventListener(
        "readystatechange",
        this.interpretReadyState,
        !1
      ),
      addEventListener("pagehide", this.pageWillUnload, !1),
      (this.started = !0));
  }
  stop() {
    this.started &&
      (document.removeEventListener(
        "readystatechange",
        this.interpretReadyState,
        !1
      ),
      removeEventListener("pagehide", this.pageWillUnload, !1),
      (this.started = !1));
  }
  interpretReadyState = () => {
    let { readyState: e } = this;
    "interactive" == e
      ? this.pageIsInteractive()
      : "complete" == e && this.pageIsComplete();
  };
  pageIsInteractive() {
    this.stage == PageStage.loading &&
      ((this.stage = PageStage.interactive),
      this.delegate.pageBecameInteractive());
  }
  pageIsComplete() {
    this.pageIsInteractive(),
      this.stage == PageStage.interactive &&
        ((this.stage = PageStage.complete), this.delegate.pageLoaded());
  }
  pageWillUnload = () => {
    this.delegate.pageWillUnload();
  };
  get readyState() {
    return document.readyState;
  }
}
class ScrollObserver {
  started = !1;
  constructor(e) {
    this.delegate = e;
  }
  start() {
    this.started ||
      (addEventListener("scroll", this.onScroll, !1),
      this.onScroll(),
      (this.started = !0));
  }
  stop() {
    this.started &&
      (removeEventListener("scroll", this.onScroll, !1), (this.started = !1));
  }
  onScroll = () => {
    this.updatePosition({ x: window.pageXOffset, y: window.pageYOffset });
  };
  updatePosition(e) {
    this.delegate.scrollPositionChanged(e);
  }
}
class StreamMessageRenderer {
  render({ fragment: e }) {
    Bardo.preservingPermanentElements(
      this,
      getPermanentElementMapForFragment(e),
      () => {
        withAutofocusFromFragment(e, () => {
          withPreservedFocus(() => {
            document.documentElement.appendChild(e);
          });
        });
      }
    );
  }
  enteringBardo(e, t) {
    t.replaceWith(e.cloneNode(!0));
  }
  leavingBardo() {}
}
function getPermanentElementMapForFragment(e) {
  let t = queryPermanentElementsAll(document.documentElement),
    r = {};
  for (let i of t) {
    let { id: s } = i;
    for (let n of e.querySelectorAll("turbo-stream")) {
      let o = getPermanentElementById(n.templateElement.content, s);
      o && (r[s] = [i, o]);
    }
  }
  return r;
}
async function withAutofocusFromFragment(e, t) {
  let r = `turbo-stream-autofocus-${uuid()}`,
    i = e.querySelectorAll("turbo-stream"),
    s = firstAutofocusableElementInStreams(i),
    n = null;
  s && ((n = s.id ? s.id : r), (s.id = n)), t(), await nextRepaint();
  let o =
    null == document.activeElement || document.activeElement == document.body;
  if (o && n) {
    let a = document.getElementById(n);
    elementIsFocusable(a) && a.focus(),
      a && a.id == r && a.removeAttribute("id");
  }
}
async function withPreservedFocus(e) {
  let [t, r] = await around(e, () => document.activeElement),
    i = t && t.id;
  if (i) {
    let s = document.getElementById(i);
    elementIsFocusable(s) && s != r && s.focus();
  }
}
function firstAutofocusableElementInStreams(e) {
  for (let t of e) {
    let r = queryAutofocusableElement(t.templateElement.content);
    if (r) return r;
  }
  return null;
}
class StreamObserver {
  sources = new Set();
  #n = !1;
  constructor(e) {
    this.delegate = e;
  }
  start() {
    this.#n ||
      ((this.#n = !0),
      addEventListener(
        "turbo:before-fetch-response",
        this.inspectFetchResponse,
        !1
      ));
  }
  stop() {
    this.#n &&
      ((this.#n = !1),
      removeEventListener(
        "turbo:before-fetch-response",
        this.inspectFetchResponse,
        !1
      ));
  }
  connectStreamSource(e) {
    this.streamSourceIsConnected(e) ||
      (this.sources.add(e),
      e.addEventListener("message", this.receiveMessageEvent, !1));
  }
  disconnectStreamSource(e) {
    this.streamSourceIsConnected(e) &&
      (this.sources.delete(e),
      e.removeEventListener("message", this.receiveMessageEvent, !1));
  }
  streamSourceIsConnected(e) {
    return this.sources.has(e);
  }
  inspectFetchResponse = (e) => {
    let t = fetchResponseFromEvent(e);
    t &&
      fetchResponseIsStream(t) &&
      (e.preventDefault(), this.receiveMessageResponse(t));
  };
  receiveMessageEvent = (e) => {
    this.#n && "string" == typeof e.data && this.receiveMessageHTML(e.data);
  };
  async receiveMessageResponse(e) {
    let t = await e.responseHTML;
    t && this.receiveMessageHTML(t);
  }
  receiveMessageHTML(e) {
    this.delegate.receivedMessageFromStream(StreamMessage.wrap(e));
  }
}
function fetchResponseFromEvent(e) {
  let t = e.detail?.fetchResponse;
  if (t instanceof FetchResponse) return t;
}
function fetchResponseIsStream(e) {
  let t = e.contentType ?? "";
  return t.startsWith(StreamMessage.contentType);
}
class ErrorRenderer extends Renderer {
  static renderElement(e, t) {
    let { documentElement: r, body: i } = document;
    r.replaceChild(t, i);
  }
  async render() {
    this.replaceHeadAndBody(), this.activateScriptElements();
  }
  replaceHeadAndBody() {
    let { documentElement: e, head: t } = document;
    e.replaceChild(this.newHead, t),
      this.renderElement(this.currentElement, this.newElement);
  }
  activateScriptElements() {
    for (let e of this.scriptElements) {
      let t = e.parentNode;
      if (t) {
        let r = activateScriptElement(e);
        t.replaceChild(r, e);
      }
    }
  }
  get newHead() {
    return this.newSnapshot.headSnapshot.element;
  }
  get scriptElements() {
    return document.documentElement.querySelectorAll("script");
  }
}
let EMPTY_SET = new Set();
function morph(e, t, r = {}) {
  e instanceof Document && (e = e.documentElement),
    "string" == typeof t && (t = parseContent(t));
  let i = normalizeContent(t),
    s = createMorphContext(e, i, r);
  return morphNormalizedContent(e, i, s);
}
function morphNormalizedContent(e, t, r) {
  if (r.head.block) {
    let i = e.querySelector("head"),
      s = t.querySelector("head");
    if (i && s) {
      Promise.all(handleHeadElement(s, i, r)).then(function () {
        morphNormalizedContent(
          e,
          t,
          Object.assign(r, { head: { block: !1, ignore: !0 } })
        );
      });
      return;
    }
  }
  if ("innerHTML" === r.morphStyle) return morphChildren(t, e, r), e.children;
  if ("outerHTML" === r.morphStyle || null == r.morphStyle) {
    let n = findBestNodeMatch(t, e, r),
      o = n?.previousSibling,
      a = n?.nextSibling,
      l = morphOldNodeTo(e, n, r);
    return n ? insertSiblings(o, l, a) : [];
  }
  throw "Do not understand how to morph style " + r.morphStyle;
}
function morphOldNodeTo(e, t, r) {
  if (r.ignoreActive && e === document.activeElement);
  else if (null == t) {
    if (!1 === r.callbacks.beforeNodeRemoved(e)) return;
    return e.remove(), r.callbacks.afterNodeRemoved(e), null;
  } else if (isSoftMatch(e, t)) {
    if (!1 === r.callbacks.beforeNodeMorphed(e, t)) return;
    return (
      (e instanceof HTMLHeadElement && r.head.ignore) ||
        (e instanceof HTMLHeadElement && "morph" !== r.head.style
          ? handleHeadElement(t, e, r)
          : (syncNodeFrom(t, e), morphChildren(t, e, r))),
      r.callbacks.afterNodeMorphed(e, t),
      e
    );
  } else {
    if (
      !1 === r.callbacks.beforeNodeRemoved(e) ||
      !1 === r.callbacks.beforeNodeAdded(t)
    )
      return;
    return (
      e.parentElement.replaceChild(t, e),
      r.callbacks.afterNodeAdded(t),
      r.callbacks.afterNodeRemoved(e),
      t
    );
  }
}
function morphChildren(e, t, r) {
  let i = e.firstChild,
    s = t.firstChild,
    n;
  for (; i; ) {
    if (((i = (n = i).nextSibling), null == s)) {
      if (!1 === r.callbacks.beforeNodeAdded(n)) return;
      t.appendChild(n),
        r.callbacks.afterNodeAdded(n),
        removeIdsFromConsideration(r, n);
      continue;
    }
    if (isIdSetMatch(n, s, r)) {
      morphOldNodeTo(s, n, r),
        (s = s.nextSibling),
        removeIdsFromConsideration(r, n);
      continue;
    }
    let o = findIdSetMatch(e, t, n, s, r);
    if (o) {
      (s = removeNodesBetween(s, o, r)),
        morphOldNodeTo(o, n, r),
        removeIdsFromConsideration(r, n);
      continue;
    }
    let a = findSoftMatch(e, t, n, s, r);
    if (a) {
      (s = removeNodesBetween(s, a, r)),
        morphOldNodeTo(a, n, r),
        removeIdsFromConsideration(r, n);
      continue;
    }
    if (!1 === r.callbacks.beforeNodeAdded(n)) return;
    t.insertBefore(n, s),
      r.callbacks.afterNodeAdded(n),
      removeIdsFromConsideration(r, n);
  }
  for (; null !== s; ) {
    let l = s;
    (s = s.nextSibling), removeNode(l, r);
  }
}
function syncNodeFrom(e, t) {
  let r = e.nodeType;
  if (1 === r) {
    let i = e.attributes,
      s = t.attributes;
    for (let n of i)
      t.getAttribute(n.name) !== n.value && t.setAttribute(n.name, n.value);
    for (let o of s) e.hasAttribute(o.name) || t.removeAttribute(o.name);
  }
  if (
    ((8 === r || 3 === r) &&
      t.nodeValue !== e.nodeValue &&
      (t.nodeValue = e.nodeValue),
    e instanceof HTMLInputElement &&
      t instanceof HTMLInputElement &&
      "file" !== e.type)
  )
    (t.value = e.value || ""),
      syncAttribute(e, t, "value"),
      syncAttribute(e, t, "checked"),
      syncAttribute(e, t, "disabled");
  else if (e instanceof HTMLOptionElement) syncAttribute(e, t, "selected");
  else if (
    e instanceof HTMLTextAreaElement &&
    t instanceof HTMLTextAreaElement
  ) {
    let a = e.value;
    a !== t.value && (t.value = a),
      t.firstChild &&
        t.firstChild.nodeValue !== a &&
        (t.firstChild.nodeValue = a);
  }
}
function syncAttribute(e, t, r) {
  e[r] !== t[r] && (e[r] ? t.setAttribute(r, e[r]) : t.removeAttribute(r));
}
function handleHeadElement(e, t, r) {
  let i = [],
    s = [],
    n = [],
    o = [],
    a = r.head.style,
    l = new Map();
  for (let h of e.children) l.set(h.outerHTML, h);
  for (let c of t.children) {
    let d = l.has(c.outerHTML),
      u = r.head.shouldReAppend(c),
      m = r.head.shouldPreserve(c);
    d || m
      ? u
        ? s.push(c)
        : (l.delete(c.outerHTML), n.push(c))
      : "append" === a
      ? u && (s.push(c), o.push(c))
      : !1 !== r.head.shouldRemove(c) && s.push(c);
  }
  o.push(...l.values());
  let p = [];
  for (let g of o) {
    let f = document
      .createRange()
      .createContextualFragment(g.outerHTML).firstChild;
    if (!1 !== r.callbacks.beforeNodeAdded(f)) {
      if (f.href || f.src) {
        let b = null,
          S = new Promise(function (e) {
            b = e;
          });
        f.addEventListener("load", function () {
          b();
        }),
          p.push(S);
      }
      t.appendChild(f), r.callbacks.afterNodeAdded(f), i.push(f);
    }
  }
  for (let v of s)
    !1 !== r.callbacks.beforeNodeRemoved(v) &&
      (t.removeChild(v), r.callbacks.afterNodeRemoved(v));
  return r.head.afterHeadMorphed(t, { added: i, kept: n, removed: s }), p;
}
function noOp() {}
function createMorphContext(e, t, r) {
  return {
    target: e,
    newContent: t,
    config: r,
    morphStyle: r.morphStyle,
    ignoreActive: r.ignoreActive,
    idMap: createIdMap(e, t),
    deadIds: new Set(),
    callbacks: Object.assign(
      {
        beforeNodeAdded: noOp,
        afterNodeAdded: noOp,
        beforeNodeMorphed: noOp,
        afterNodeMorphed: noOp,
        beforeNodeRemoved: noOp,
        afterNodeRemoved: noOp,
      },
      r.callbacks
    ),
    head: Object.assign(
      {
        style: "merge",
        shouldPreserve: function (e) {
          return "true" === e.getAttribute("im-preserve");
        },
        shouldReAppend: function (e) {
          return "true" === e.getAttribute("im-re-append");
        },
        shouldRemove: noOp,
        afterHeadMorphed: noOp,
      },
      r.head
    ),
  };
}
function isIdSetMatch(e, t, r) {
  return (
    null != e &&
    null != t &&
    e.nodeType === t.nodeType &&
    e.tagName === t.tagName &&
    (("" !== e.id && e.id === t.id) || getIdIntersectionCount(r, e, t) > 0)
  );
}
function isSoftMatch(e, t) {
  return (
    null != e &&
    null != t &&
    e.nodeType === t.nodeType &&
    e.tagName === t.tagName
  );
}
function removeNodesBetween(e, t, r) {
  for (; e !== t; ) {
    let i = e;
    (e = e.nextSibling), removeNode(i, r);
  }
  return removeIdsFromConsideration(r, t), t.nextSibling;
}
function findIdSetMatch(e, t, r, i, s) {
  let n = getIdIntersectionCount(s, r, t);
  if (n > 0) {
    let o = i,
      a = 0;
    for (; null != o; ) {
      if (isIdSetMatch(r, o, s)) return o;
      if ((a += getIdIntersectionCount(s, o, e)) > n) break;
      o = o.nextSibling;
    }
  }
  return null;
}
function findSoftMatch(e, t, r, i, s) {
  let n = i,
    o = r.nextSibling,
    a = 0;
  for (; null != n; ) {
    if (getIdIntersectionCount(s, n, e) > 0) return null;
    if (isSoftMatch(r, n)) break;
    if (isSoftMatch(o, n) && (a++, (o = o.nextSibling), a >= 2)) return null;
    n = n.nextSibling;
  }
  return n;
}
function parseContent(e) {
  let t = new DOMParser(),
    r = e.replace(/<svg(\s[^>]*>|>)([\s\S]*?)<\/svg>/gim, "");
  if (r.match(/<\/html>/) || r.match(/<\/head>/) || r.match(/<\/body>/)) {
    let i = t.parseFromString(e, "text/html");
    if (r.match(/<\/html>/)) return (i.generatedByIdiomorph = !0), i;
    {
      let s = i.firstChild;
      return s ? ((s.generatedByIdiomorph = !0), s) : null;
    }
  }
  {
    let n = t
      .parseFromString(
        "<body><template>" + e + "</template></body>",
        "text/html"
      )
      .body.querySelector("template").content;
    return (n.generatedByIdiomorph = !0), n;
  }
}
function normalizeContent(e) {
  if (null == e) {
    let t = document.createElement("div");
    return t;
  }
  if (e.generatedByIdiomorph) return e;
  if (e instanceof Node) {
    let r = document.createElement("div");
    return r.append(e), r;
  }
  {
    let i = document.createElement("div");
    for (let s of [...e]) i.append(s);
    return i;
  }
}
function insertSiblings(e, t, r) {
  let i = [],
    s = [];
  for (; null != e; ) i.push(e), (e = e.previousSibling);
  for (; i.length > 0; ) {
    let n = i.pop();
    s.push(n), t.parentElement.insertBefore(n, t);
  }
  for (s.push(t); null != r; ) i.push(r), s.push(r), (r = r.nextSibling);
  for (; i.length > 0; ) t.parentElement.insertBefore(i.pop(), t.nextSibling);
  return s;
}
function findBestNodeMatch(e, t, r) {
  let i,
    s = (i = e.firstChild),
    n = 0;
  for (; i; ) {
    let o = scoreElement(i, t, r);
    o > n && ((s = i), (n = o)), (i = i.nextSibling);
  }
  return s;
}
function scoreElement(e, t, r) {
  return isSoftMatch(e, t) ? 0.5 + getIdIntersectionCount(r, e, t) : 0;
}
function removeNode(e, t) {
  removeIdsFromConsideration(t, e),
    !1 !== t.callbacks.beforeNodeRemoved(e) &&
      (e.remove(), t.callbacks.afterNodeRemoved(e));
}
function isIdInConsideration(e, t) {
  return !e.deadIds.has(t);
}
function idIsWithinNode(e, t, r) {
  return (e.idMap.get(r) || EMPTY_SET).has(t);
}
function removeIdsFromConsideration(e, t) {
  let r = e.idMap.get(t) || EMPTY_SET;
  for (let i of r) e.deadIds.add(i);
}
function getIdIntersectionCount(e, t, r) {
  let i = e.idMap.get(t) || EMPTY_SET,
    s = 0;
  for (let n of i) isIdInConsideration(e, n) && idIsWithinNode(e, n, r) && ++s;
  return s;
}
function populateIdMapForNode(e, t) {
  let r = e.parentElement,
    i = e.querySelectorAll("[id]");
  for (let s of i) {
    let n = s;
    for (; n !== r && null != n; ) {
      let o = t.get(n);
      null == o && ((o = new Set()), t.set(n, o)),
        o.add(s.id),
        (n = n.parentElement);
    }
  }
}
function createIdMap(e, t) {
  let r = new Map();
  return populateIdMapForNode(e, r), populateIdMapForNode(t, r), r;
}
var idiomorph = { morph };
class MorphRenderer extends Renderer {
  async render() {
    this.willRender && (await this.#o());
  }
  get renderMethod() {
    return "morph";
  }
  async #o() {
    this.#p(this.currentElement, this.newElement),
      this.#q(),
      dispatch("turbo:morph", {
        detail: {
          currentElement: this.currentElement,
          newElement: this.newElement,
        },
      });
  }
  #p(A, C, L = "outerHTML") {
    (this.isMorphingTurboFrame = this.#r(A)),
      idiomorph.morph(A, C, {
        morphStyle: L,
        callbacks: {
          beforeNodeAdded: this.#s,
          beforeNodeMorphed: this.#t,
          beforeNodeRemoved: this.#u,
        },
      });
  }
  #s = (e) =>
    !(
      e.id &&
      e.hasAttribute("data-turbo-permanent") &&
      document.getElementById(e.id)
    );
  #t = (e, t) =>
    !(e instanceof HTMLElement) ||
    (!e.hasAttribute("data-turbo-permanent") &&
      (this.isMorphingTurboFrame || !this.#r(e)));
  #u = (e) => this.#t(e);
  #q() {
    this.#v().forEach((e) => {
      this.#r(e) && (this.#w(e), e.reload());
    });
  }
  #w(F) {
    F.addEventListener(
      "turbo:before-frame-render",
      (e) => {
        e.detail.render = this.#x;
      },
      { once: !0 }
    );
  }
  #x = (e, t) => {
    dispatch("turbo:before-frame-morph", {
      target: e,
      detail: { currentElement: e, newElement: t },
    }),
      this.#p(e, t.children, "innerHTML");
  };
  #r(T) {
    return T.src && "morph" === T.refresh;
  }
  #v() {
    return Array.from(document.querySelectorAll("turbo-frame[src]")).filter(
      (e) => !e.closest("[data-turbo-permanent]")
    );
  }
}
class PageRenderer extends Renderer {
  static renderElement(e, t) {
    document.body && t instanceof HTMLBodyElement
      ? document.body.replaceWith(t)
      : document.documentElement.appendChild(t);
  }
  get shouldRender() {
    return this.newSnapshot.isVisitable && this.trackedElementsAreIdentical;
  }
  get reloadReason() {
    return this.newSnapshot.isVisitable
      ? this.trackedElementsAreIdentical
        ? void 0
        : { reason: "tracked_element_mismatch" }
      : { reason: "turbo_visit_control_is_reload" };
  }
  async prepareToRender() {
    this.#y(), await this.mergeHead();
  }
  async render() {
    this.willRender && (await this.replaceBody());
  }
  finishRendering() {
    super.finishRendering(),
      this.isPreview || this.focusFirstAutofocusableElement();
  }
  get currentHeadSnapshot() {
    return this.currentSnapshot.headSnapshot;
  }
  get newHeadSnapshot() {
    return this.newSnapshot.headSnapshot;
  }
  get newElement() {
    return this.newSnapshot.element;
  }
  #y() {
    let { documentElement: P } = this.currentSnapshot,
      { lang: M } = this.newSnapshot;
    M ? P.setAttribute("lang", M) : P.removeAttribute("lang");
  }
  async mergeHead() {
    let e = this.mergeProvisionalElements(),
      t = this.copyNewHeadStylesheetElements();
    this.copyNewHeadScriptElements(), await e, await t;
  }
  async replaceBody() {
    await this.preservingPermanentElements(async () => {
      this.activateNewBody(), await this.assignNewBody();
    });
  }
  get trackedElementsAreIdentical() {
    return (
      this.currentHeadSnapshot.trackedElementSignature ==
      this.newHeadSnapshot.trackedElementSignature
    );
  }
  async copyNewHeadStylesheetElements() {
    let e = [];
    for (let t of this.newHeadStylesheetElements)
      e.push(waitForLoad(t)), document.head.appendChild(t);
    await Promise.all(e);
  }
  copyNewHeadScriptElements() {
    for (let e of this.newHeadScriptElements)
      document.head.appendChild(activateScriptElement(e));
  }
  async mergeProvisionalElements() {
    let e = [...this.newHeadProvisionalElements];
    for (let t of this.currentHeadProvisionalElements)
      this.isCurrentElementInElementList(t, e) || document.head.removeChild(t);
    for (let r of e) document.head.appendChild(r);
  }
  isCurrentElementInElementList(e, t) {
    for (let [r, i] of t.entries()) {
      if ("TITLE" == e.tagName) {
        if ("TITLE" != i.tagName) continue;
        if (e.innerHTML == i.innerHTML) return t.splice(r, 1), !0;
      }
      if (i.isEqualNode(e)) return t.splice(r, 1), !0;
    }
    return !1;
  }
  removeCurrentHeadProvisionalElements() {
    for (let e of this.currentHeadProvisionalElements)
      document.head.removeChild(e);
  }
  copyNewHeadProvisionalElements() {
    for (let e of this.newHeadProvisionalElements) document.head.appendChild(e);
  }
  activateNewBody() {
    document.adoptNode(this.newElement), this.activateNewBodyScriptElements();
  }
  activateNewBodyScriptElements() {
    for (let e of this.newBodyScriptElements) {
      let t = activateScriptElement(e);
      e.replaceWith(t);
    }
  }
  async assignNewBody() {
    await this.renderElement(this.currentElement, this.newElement);
  }
  get newHeadStylesheetElements() {
    return this.newHeadSnapshot.getStylesheetElementsNotInSnapshot(
      this.currentHeadSnapshot
    );
  }
  get newHeadScriptElements() {
    return this.newHeadSnapshot.getScriptElementsNotInSnapshot(
      this.currentHeadSnapshot
    );
  }
  get currentHeadProvisionalElements() {
    return this.currentHeadSnapshot.provisionalElements;
  }
  get newHeadProvisionalElements() {
    return this.newHeadSnapshot.provisionalElements;
  }
  get newBodyScriptElements() {
    return this.newElement.querySelectorAll("script");
  }
}
class SnapshotCache {
  keys = [];
  snapshots = {};
  constructor(e) {
    this.size = e;
  }
  has(e) {
    return toCacheKey(e) in this.snapshots;
  }
  get(e) {
    if (this.has(e)) {
      let t = this.read(e);
      return this.touch(e), t;
    }
  }
  put(e, t) {
    return this.write(e, t), this.touch(e), t;
  }
  clear() {
    this.snapshots = {};
  }
  read(e) {
    return this.snapshots[toCacheKey(e)];
  }
  write(e, t) {
    this.snapshots[toCacheKey(e)] = t;
  }
  touch(e) {
    let t = toCacheKey(e),
      r = this.keys.indexOf(t);
    r > -1 && this.keys.splice(r, 1), this.keys.unshift(t), this.trim();
  }
  trim() {
    for (let e of this.keys.splice(this.size)) delete this.snapshots[e];
  }
}
class PageView extends View {
  snapshotCache = new SnapshotCache(10);
  lastRenderedLocation = new URL(location.href);
  forceReloaded = !1;
  shouldTransitionTo(e) {
    return this.snapshot.prefersViewTransitions && e.prefersViewTransitions;
  }
  renderPage(e, t = !1, r = !0, i) {
    let s = this.isPageRefresh(i) && this.snapshot.shouldMorphPage,
      n = new (s ? MorphRenderer : PageRenderer)(
        this.snapshot,
        e,
        PageRenderer.renderElement,
        t,
        r
      );
    return (
      n.shouldRender ? i?.changeHistory() : (this.forceReloaded = !0),
      this.render(n)
    );
  }
  renderError(e, t) {
    t?.changeHistory();
    let r = new ErrorRenderer(
      this.snapshot,
      e,
      ErrorRenderer.renderElement,
      !1
    );
    return this.render(r);
  }
  clearSnapshotCache() {
    this.snapshotCache.clear();
  }
  async cacheSnapshot(e = this.snapshot) {
    if (e.isCacheable) {
      this.delegate.viewWillCacheSnapshot();
      let { lastRenderedLocation: t } = this;
      await nextEventLoopTick();
      let r = e.clone();
      return this.snapshotCache.put(t, r), r;
    }
  }
  getCachedSnapshotForLocation(e) {
    return this.snapshotCache.get(e);
  }
  isPageRefresh(e) {
    return (
      !e ||
      (this.lastRenderedLocation.pathname === e.location.pathname &&
        "replace" === e.action)
    );
  }
  shouldPreserveScrollPosition(e) {
    return this.isPageRefresh(e) && this.snapshot.shouldPreserveScrollPosition;
  }
  get snapshot() {
    return PageSnapshot.fromElement(this.element);
  }
}
class Preloader {
  selector = "a[data-turbo-preload]";
  constructor(e, t) {
    (this.delegate = e), (this.snapshotCache = t);
  }
  start() {
    "loading" === document.readyState
      ? document.addEventListener("DOMContentLoaded", this.#z)
      : this.preloadOnLoadLinksForView(document.body);
  }
  stop() {
    document.removeEventListener("DOMContentLoaded", this.#z);
  }
  preloadOnLoadLinksForView(e) {
    for (let t of e.querySelectorAll(this.selector))
      this.delegate.shouldPreloadLink(t) && this.preloadURL(t);
  }
  async preloadURL(e) {
    let t = new URL(e.href);
    if (this.snapshotCache.has(t)) return;
    let r = new FetchRequest(
      this,
      FetchMethod.get,
      t,
      new URLSearchParams(),
      e
    );
    await r.perform();
  }
  prepareRequest(e) {
    e.headers["Sec-Purpose"] = "prefetch";
  }
  async requestSucceededWithResponse(e, t) {
    try {
      let r = await t.responseHTML,
        i = PageSnapshot.fromHTMLString(r);
      this.snapshotCache.put(e.url, i);
    } catch (s) {}
  }
  requestStarted(e) {}
  requestErrored(e) {}
  requestFinished(e) {}
  requestPreventedHandlingResponse(e, t) {}
  requestFailedWithResponse(e, t) {}
  #z = () => {
    this.preloadOnLoadLinksForView(document.body);
  };
}
class Cache {
  constructor(e) {
    this.session = e;
  }
  clear() {
    this.session.clearCache();
  }
  resetCacheControl() {
    this.#A("");
  }
  exemptPageFromCache() {
    this.#A("no-cache");
  }
  exemptPageFromPreview() {
    this.#A("no-preview");
  }
  #A(k) {
    setMetaContent("turbo-cache-control", k);
  }
}
class Session {
  navigator = new Navigator(this);
  history = new History(this);
  view = new PageView(this, document.documentElement);
  adapter = new BrowserAdapter(this);
  pageObserver = new PageObserver(this);
  cacheObserver = new CacheObserver();
  linkClickObserver = new LinkClickObserver(this, window);
  formSubmitObserver = new FormSubmitObserver(this, document);
  scrollObserver = new ScrollObserver(this);
  streamObserver = new StreamObserver(this);
  formLinkClickObserver = new FormLinkClickObserver(
    this,
    document.documentElement
  );
  frameRedirector = new FrameRedirector(this, document.documentElement);
  streamMessageRenderer = new StreamMessageRenderer();
  cache = new Cache(this);
  drive = !0;
  enabled = !0;
  progressBarDelay = 500;
  started = !1;
  formMode = "on";
  constructor(e) {
    (this.recentRequests = e),
      (this.preloader = new Preloader(this, this.view.snapshotCache));
  }
  start() {
    this.started ||
      (this.pageObserver.start(),
      this.cacheObserver.start(),
      this.formLinkClickObserver.start(),
      this.linkClickObserver.start(),
      this.formSubmitObserver.start(),
      this.scrollObserver.start(),
      this.streamObserver.start(),
      this.frameRedirector.start(),
      this.history.start(),
      this.preloader.start(),
      (this.started = !0),
      (this.enabled = !0));
  }
  disable() {
    this.enabled = !1;
  }
  stop() {
    this.started &&
      (this.pageObserver.stop(),
      this.cacheObserver.stop(),
      this.formLinkClickObserver.stop(),
      this.linkClickObserver.stop(),
      this.formSubmitObserver.stop(),
      this.scrollObserver.stop(),
      this.streamObserver.stop(),
      this.frameRedirector.stop(),
      this.history.stop(),
      this.preloader.stop(),
      (this.started = !1));
  }
  registerAdapter(e) {
    this.adapter = e;
  }
  visit(e, t = {}) {
    let r = t.frame ? document.getElementById(t.frame) : null;
    r instanceof FrameElement
      ? ((r.src = e.toString()), r.loaded)
      : this.navigator.proposeVisit(expandURL(e), t);
  }
  refresh(e, t) {
    let r = t && this.recentRequests.has(t);
    r ||
      (this.cache.exemptPageFromPreview(),
      this.visit(e, { action: "replace" }));
  }
  connectStreamSource(e) {
    this.streamObserver.connectStreamSource(e);
  }
  disconnectStreamSource(e) {
    this.streamObserver.disconnectStreamSource(e);
  }
  renderStreamMessage(e) {
    this.streamMessageRenderer.render(StreamMessage.wrap(e));
  }
  clearCache() {
    this.view.clearSnapshotCache();
  }
  setProgressBarDelay(e) {
    this.progressBarDelay = e;
  }
  setFormMode(e) {
    this.formMode = e;
  }
  get location() {
    return this.history.location;
  }
  get restorationIdentifier() {
    return this.history.restorationIdentifier;
  }
  shouldPreloadLink(e) {
    let t = e.hasAttribute("data-turbo-method"),
      r = e.hasAttribute("data-turbo-stream"),
      i = e.getAttribute("data-turbo-frame"),
      s =
        "_top" == i
          ? null
          : document.getElementById(i) ||
            findClosestRecursively(e, "turbo-frame:not([disabled])");
    if (t || r || s instanceof FrameElement) return !1;
    {
      let n = new URL(e.href);
      return (
        this.elementIsNavigatable(e) &&
        locationIsVisitable(n, this.snapshot.rootLocation)
      );
    }
  }
  historyPoppedToLocationWithRestorationIdentifierAndDirection(e, t, r) {
    this.enabled
      ? this.navigator.startVisit(e, t, {
          action: "restore",
          historyChanged: !0,
          direction: r,
        })
      : this.adapter.pageInvalidated({ reason: "turbo_disabled" });
  }
  scrollPositionChanged(e) {
    this.history.updateRestorationData({ scrollPosition: e });
  }
  willSubmitFormLinkToLocation(e, t) {
    return (
      this.elementIsNavigatable(e) &&
      locationIsVisitable(t, this.snapshot.rootLocation)
    );
  }
  submittedFormLinkToLocation() {}
  willFollowLinkToLocation(e, t, r) {
    return (
      this.elementIsNavigatable(e) &&
      locationIsVisitable(t, this.snapshot.rootLocation) &&
      this.applicationAllowsFollowingLinkToLocation(e, t, r)
    );
  }
  followedLinkToLocation(e, t) {
    let r = this.getActionForLink(e),
      i = e.hasAttribute("data-turbo-stream");
    this.visit(t.href, { action: r, acceptsStreamResponse: i });
  }
  allowsVisitingLocationWithAction(e, t) {
    return (
      this.locationWithActionIsSamePage(e, t) ||
      this.applicationAllowsVisitingLocation(e)
    );
  }
  visitProposedToLocation(e, t) {
    extendURLWithDeprecatedProperties(e),
      this.adapter.visitProposedToLocation(e, t);
  }
  visitStarted(e) {
    e.acceptsStreamResponse ||
      (markAsBusy(document.documentElement),
      this.view.markVisitDirection(e.direction)),
      extendURLWithDeprecatedProperties(e.location),
      e.silent ||
        this.notifyApplicationAfterVisitingLocation(e.location, e.action);
  }
  visitCompleted(e) {
    this.view.unmarkVisitDirection(),
      clearBusyState(document.documentElement),
      this.notifyApplicationAfterPageLoad(e.getTimingMetrics());
  }
  locationWithActionIsSamePage(e, t) {
    return this.navigator.locationWithActionIsSamePage(e, t);
  }
  visitScrolledToSamePageLocation(e, t) {
    this.notifyApplicationAfterVisitingSamePageLocation(e, t);
  }
  willSubmitForm(e, t) {
    let r = getAction$1(e, t);
    return (
      this.submissionIsNavigatable(e, t) &&
      locationIsVisitable(expandURL(r), this.snapshot.rootLocation)
    );
  }
  formSubmitted(e, t) {
    this.navigator.submitForm(e, t);
  }
  pageBecameInteractive() {
    (this.view.lastRenderedLocation = this.location),
      this.notifyApplicationAfterPageLoad();
  }
  pageLoaded() {
    this.history.assumeControlOfScrollRestoration();
  }
  pageWillUnload() {
    this.history.relinquishControlOfScrollRestoration();
  }
  receivedMessageFromStream(e) {
    this.renderStreamMessage(e);
  }
  viewWillCacheSnapshot() {
    this.navigator.currentVisit?.silent ||
      this.notifyApplicationBeforeCachingSnapshot();
  }
  allowsImmediateRender({ element: e }, t, r) {
    let i = this.notifyApplicationBeforeRender(e, t, r),
      {
        defaultPrevented: s,
        detail: { render: n },
      } = i;
    return (
      this.view.renderer && n && (this.view.renderer.renderElement = n), !s
    );
  }
  viewRenderedSnapshot(e, t, r) {
    (this.view.lastRenderedLocation = this.history.location),
      this.notifyApplicationAfterRender(t, r);
  }
  preloadOnLoadLinksForView(e) {
    this.preloader.preloadOnLoadLinksForView(e);
  }
  viewInvalidated(e) {
    this.adapter.pageInvalidated(e);
  }
  frameLoaded(e) {
    this.notifyApplicationAfterFrameLoad(e);
  }
  frameRendered(e, t) {
    this.notifyApplicationAfterFrameRender(e, t);
  }
  applicationAllowsFollowingLinkToLocation(e, t, r) {
    let i = this.notifyApplicationAfterClickingLinkToLocation(e, t, r);
    return !i.defaultPrevented;
  }
  applicationAllowsVisitingLocation(e) {
    let t = this.notifyApplicationBeforeVisitingLocation(e);
    return !t.defaultPrevented;
  }
  notifyApplicationAfterClickingLinkToLocation(e, t, r) {
    return dispatch("turbo:click", {
      target: e,
      detail: { url: t.href, originalEvent: r },
      cancelable: !0,
    });
  }
  notifyApplicationBeforeVisitingLocation(e) {
    return dispatch("turbo:before-visit", {
      detail: { url: e.href },
      cancelable: !0,
    });
  }
  notifyApplicationAfterVisitingLocation(e, t) {
    return dispatch("turbo:visit", { detail: { url: e.href, action: t } });
  }
  notifyApplicationBeforeCachingSnapshot() {
    return dispatch("turbo:before-cache");
  }
  notifyApplicationBeforeRender(e, t, r) {
    return dispatch("turbo:before-render", {
      detail: { newBody: e, isPreview: t, ...r },
      cancelable: !0,
    });
  }
  notifyApplicationAfterRender(e, t) {
    return dispatch("turbo:render", {
      detail: { isPreview: e, renderMethod: t },
    });
  }
  notifyApplicationAfterPageLoad(e = {}) {
    return dispatch("turbo:load", {
      detail: { url: this.location.href, timing: e },
    });
  }
  notifyApplicationAfterVisitingSamePageLocation(e, t) {
    dispatchEvent(
      new HashChangeEvent("hashchange", {
        oldURL: e.toString(),
        newURL: t.toString(),
      })
    );
  }
  notifyApplicationAfterFrameLoad(e) {
    return dispatch("turbo:frame-load", { target: e });
  }
  notifyApplicationAfterFrameRender(e, t) {
    return dispatch("turbo:frame-render", {
      detail: { fetchResponse: e },
      target: t,
      cancelable: !0,
    });
  }
  submissionIsNavigatable(e, t) {
    if ("off" == this.formMode) return !1;
    {
      let r = !t || this.elementIsNavigatable(t);
      return "optin" == this.formMode
        ? r && null != e.closest('[data-turbo="true"]')
        : r && this.elementIsNavigatable(e);
    }
  }
  elementIsNavigatable(e) {
    let t = findClosestRecursively(e, "[data-turbo]"),
      r = findClosestRecursively(e, "turbo-frame");
    return this.drive || r
      ? !t || "false" != t.getAttribute("data-turbo")
      : !!t && "true" == t.getAttribute("data-turbo");
  }
  getActionForLink(e) {
    return getVisitAction(e) || "advance";
  }
  get snapshot() {
    return this.view.snapshot;
  }
}
function extendURLWithDeprecatedProperties(e) {
  Object.defineProperties(e, deprecatedLocationPropertyDescriptors);
}
let deprecatedLocationPropertyDescriptors = {
    absoluteURL: {
      get() {
        return this.toString();
      },
    },
  },
  session = new Session(recentRequests),
  { cache: I, navigator: navigator$1 } = session;
function start() {
  session.start();
}
function registerAdapter(e) {
  session.registerAdapter(e);
}
function visit(e, t) {
  session.visit(e, t);
}
function connectStreamSource(e) {
  session.connectStreamSource(e);
}
function disconnectStreamSource(e) {
  session.disconnectStreamSource(e);
}
function renderStreamMessage(e) {
  session.renderStreamMessage(e);
}
function clearCache() {
  console.warn(
    "Please replace `Turbo.clearCache()` with `Turbo.cache.clear()`. The top-level function is deprecated and will be removed in a future version of Turbo.`"
  ),
    session.clearCache();
}
function setProgressBarDelay(e) {
  session.setProgressBarDelay(e);
}
function setConfirmMethod(e) {
  FormSubmission.confirmMethod = e;
}
function setFormMode(e) {
  session.setFormMode(e);
}
var Turbo = Object.freeze({
  __proto__: null,
  navigator: navigator$1,
  session: session,
  cache: I,
  PageRenderer: PageRenderer,
  PageSnapshot: PageSnapshot,
  FrameRenderer: FrameRenderer,
  fetch: fetchWithTurboHeaders,
  start: start,
  registerAdapter: registerAdapter,
  visit: visit,
  connectStreamSource: connectStreamSource,
  disconnectStreamSource: disconnectStreamSource,
  renderStreamMessage: renderStreamMessage,
  clearCache: clearCache,
  setProgressBarDelay: setProgressBarDelay,
  setConfirmMethod: setConfirmMethod,
  setFormMode: setFormMode,
});
class TurboFrameMissingError extends Error {}
class FrameController {
  fetchResponseLoaded = (e) => Promise.resolve();
  #B = null;
  #C = () => {};
  #D = !1;
  #E = !1;
  #F = new Set();
  action = null;
  constructor(e) {
    (this.element = e),
      (this.view = new FrameView(this, this.element)),
      (this.appearanceObserver = new AppearanceObserver(this, this.element)),
      (this.formLinkClickObserver = new FormLinkClickObserver(
        this,
        this.element
      )),
      (this.linkInterceptor = new LinkInterceptor(this, this.element)),
      (this.restorationIdentifier = uuid()),
      (this.formSubmitObserver = new FormSubmitObserver(this, this.element));
  }
  connect() {
    this.#D ||
      ((this.#D = !0),
      this.loadingStyle == FrameLoadingStyle.lazy
        ? this.appearanceObserver.start()
        : this.#G(),
      this.formLinkClickObserver.start(),
      this.linkInterceptor.start(),
      this.formSubmitObserver.start());
  }
  disconnect() {
    this.#D &&
      ((this.#D = !1),
      this.appearanceObserver.stop(),
      this.formLinkClickObserver.stop(),
      this.linkInterceptor.stop(),
      this.formSubmitObserver.stop());
  }
  disabledChanged() {
    this.loadingStyle == FrameLoadingStyle.eager && this.#G();
  }
  sourceURLChanged() {
    !this.#H("src") &&
      (this.element.isConnected && (this.complete = !1),
      (this.loadingStyle == FrameLoadingStyle.eager || this.#E) && this.#G());
  }
  sourceURLReloaded() {
    let { src: e } = this.element;
    return (
      this.#I("complete", () => {
        this.element.removeAttribute("complete");
      }),
      (this.element.src = null),
      (this.element.src = e),
      this.element.loaded
    );
  }
  completeChanged() {
    this.#H("complete") || this.#G();
  }
  loadingStyleChanged() {
    this.loadingStyle == FrameLoadingStyle.lazy
      ? this.appearanceObserver.start()
      : (this.appearanceObserver.stop(), this.#G());
  }
  async #G() {
    this.enabled &&
      this.isActive &&
      !this.complete &&
      this.sourceURL &&
      ((this.element.loaded = this.#J(expandURL(this.sourceURL))),
      this.appearanceObserver.stop(),
      await this.element.loaded,
      (this.#E = !0));
  }
  async loadResponse(e) {
    (e.redirected || (e.succeeded && e.isHTML)) &&
      (this.sourceURL = e.response.url);
    try {
      let t = await e.responseHTML;
      if (t) {
        let r = parseHTMLDocument(t),
          i = PageSnapshot.fromDocument(r);
        i.isVisitable ? await this.#K(e, r) : await this.#L(e);
      }
    } finally {
      this.fetchResponseLoaded = () => Promise.resolve();
    }
  }
  elementAppearedInViewport(e) {
    this.proposeVisitIfNavigatedWithAction(e, e), this.#G();
  }
  willSubmitFormLinkToLocation(e) {
    return this.#M(e);
  }
  submittedFormLinkToLocation(e, t, r) {
    let i = this.#j(e);
    i && r.setAttribute("data-turbo-frame", i.id);
  }
  shouldInterceptLinkClick(e, t, r) {
    return this.#M(e);
  }
  linkClickIntercepted(e, t) {
    this.#N(e, t);
  }
  willSubmitForm(e, t) {
    return e.closest("turbo-frame") == this.element && this.#M(e, t);
  }
  formSubmitted(e, t) {
    this.formSubmission && this.formSubmission.stop(),
      (this.formSubmission = new FormSubmission(this, e, t));
    let { fetchRequest: r } = this.formSubmission;
    this.prepareRequest(r), this.formSubmission.start();
  }
  prepareRequest(e) {
    (e.headers["Turbo-Frame"] = this.id),
      this.currentNavigationElement?.hasAttribute("data-turbo-stream") &&
        e.acceptResponseType(StreamMessage.contentType);
  }
  requestStarted(e) {
    markAsBusy(this.element);
  }
  requestPreventedHandlingResponse(e, t) {
    this.#C();
  }
  async requestSucceededWithResponse(e, t) {
    await this.loadResponse(t), this.#C();
  }
  async requestFailedWithResponse(e, t) {
    await this.loadResponse(t), this.#C();
  }
  requestErrored(e, t) {
    console.error(t), this.#C();
  }
  requestFinished(e) {
    clearBusyState(this.element);
  }
  formSubmissionStarted({ formElement: e }) {
    markAsBusy(e, this.#j(e));
  }
  formSubmissionSucceededWithResponse(e, t) {
    let r = this.#j(e.formElement, e.submitter);
    r.delegate.proposeVisitIfNavigatedWithAction(r, e.formElement, e.submitter),
      r.delegate.loadResponse(t),
      e.isSafe || session.clearCache();
  }
  formSubmissionFailedWithResponse(e, t) {
    this.element.delegate.loadResponse(t), session.clearCache();
  }
  formSubmissionErrored(e, t) {
    console.error(t);
  }
  formSubmissionFinished({ formElement: e }) {
    clearBusyState(e, this.#j(e));
  }
  allowsImmediateRender({ element: e }, t, r) {
    let i = dispatch("turbo:before-frame-render", {
        target: this.element,
        detail: { newFrame: e, ...r },
        cancelable: !0,
      }),
      {
        defaultPrevented: s,
        detail: { render: n },
      } = i;
    return (
      this.view.renderer && n && (this.view.renderer.renderElement = n), !s
    );
  }
  viewRenderedSnapshot(e, t, r) {}
  preloadOnLoadLinksForView(e) {
    session.preloadOnLoadLinksForView(e);
  }
  viewInvalidated() {}
  willRenderFrame(e, t) {
    this.previousFrameElement = e.cloneNode(!0);
  }
  visitCachedSnapshot = ({ element: e }) => {
    let t = e.querySelector("#" + this.element.id);
    t &&
      this.previousFrameElement &&
      t.replaceChildren(...this.previousFrameElement.children),
      delete this.previousFrameElement;
  };
  async #K($, B) {
    let q = await this.extractForeignFrameElement(B.body);
    if (q) {
      let N = new Snapshot(q),
        x = new FrameRenderer(
          this,
          this.view.snapshot,
          N,
          FrameRenderer.renderElement,
          !1,
          !1
        );
      this.view.renderPromise && (await this.view.renderPromise),
        this.changeHistory(),
        await this.view.render(x),
        (this.complete = !0),
        session.frameRendered($, this.element),
        session.frameLoaded(this.element),
        await this.fetchResponseLoaded($);
    } else this.#O($) && this.#P($);
  }
  async #J(_) {
    let H = new FetchRequest(
      this,
      FetchMethod.get,
      _,
      new URLSearchParams(),
      this.element
    );
    return (
      this.#B?.cancel(),
      (this.#B = H),
      new Promise((e) => {
        (this.#C = () => {
          (this.#C = () => {}), (this.#B = null), e();
        }),
          H.perform();
      })
    );
  }
  #N(V, O, D) {
    let W = this.#j(V, D);
    W.delegate.proposeVisitIfNavigatedWithAction(W, V, D),
      this.#Q(V, () => {
        W.src = O;
      });
  }
  proposeVisitIfNavigatedWithAction(e, t, r) {
    if (((this.action = getVisitAction(r, t, e)), this.action)) {
      let i = PageSnapshot.fromElement(e).clone(),
        { visitCachedSnapshot: s } = e.delegate;
      e.delegate.fetchResponseLoaded = async (t) => {
        if (e.src) {
          let { statusCode: r, redirected: n } = t,
            o = await t.responseHTML,
            a = {
              response: { statusCode: r, redirected: n, responseHTML: o },
              visitCachedSnapshot: s,
              willRender: !1,
              updateHistory: !1,
              restorationIdentifier: this.restorationIdentifier,
              snapshot: i,
            };
          this.action && (a.action = this.action), session.visit(e.src, a);
        }
      };
    }
  }
  changeHistory() {
    if (this.action) {
      let e = getHistoryMethodForAction(this.action);
      session.history.update(
        e,
        expandURL(this.element.src || ""),
        this.restorationIdentifier
      );
    }
  }
  async #L(U) {
    console.warn(
      `The response (${U.statusCode}) from <turbo-frame id="${this.element.id}"> is performing a full page visit due to turbo-visit-control.`
    ),
      await this.#R(U.response);
  }
  #O(z) {
    this.element.setAttribute("complete", "");
    let K = z.response,
      j = async (e, t) => {
        e instanceof Response ? this.#R(e) : session.visit(e, t);
      },
      Y = dispatch("turbo:frame-missing", {
        target: this.element,
        detail: { response: K, visit: j },
        cancelable: !0,
      });
    return !Y.defaultPrevented;
  }
  #P(X) {
    this.view.missing(), this.#S(X);
  }
  #S(Q) {
    let J = `The response (${Q.statusCode}) did not contain the expected <turbo-frame id="${this.element.id}"> and will be ignored. To perform a full page visit instead, set turbo-visit-control to reload.`;
    throw new TurboFrameMissingError(J);
  }
  async #R(G) {
    let Z = new FetchResponse(G),
      ee = await Z.responseHTML,
      { location: et, redirected: er, statusCode: ei } = Z;
    return session.visit(et, {
      response: { redirected: er, statusCode: ei, responseHTML: ee },
    });
  }
  #j(es, en) {
    let eo =
      getAttribute("data-turbo-frame", en, es) ||
      this.element.getAttribute("target");
    return getFrameElementById(eo) ?? this.element;
  }
  async extractForeignFrameElement(e) {
    let t,
      r = CSS.escape(this.id);
    try {
      if (
        (t = activateElement(
          e.querySelector(`turbo-frame#${r}`),
          this.sourceURL
        ))
      )
        return t;
      if (
        (t = activateElement(
          e.querySelector(`turbo-frame[src][recurse~=${r}]`),
          this.sourceURL
        ))
      )
        return await t.loaded, await this.extractForeignFrameElement(t);
    } catch (i) {
      return console.error(i), new FrameElement();
    }
    return null;
  }
  #T(ea, el) {
    let eh = getAction$1(ea, el);
    return locationIsVisitable(expandURL(eh), this.rootLocation);
  }
  #M(ec, ed) {
    let eu =
      getAttribute("data-turbo-frame", ed, ec) ||
      this.element.getAttribute("target");
    if (
      (ec instanceof HTMLFormElement && !this.#T(ec, ed)) ||
      !this.enabled ||
      "_top" == eu
    )
      return !1;
    if (eu) {
      let em = getFrameElementById(eu);
      if (em) return !em.disabled;
    }
    return !!(
      session.elementIsNavigatable(ec) &&
      (!ed || session.elementIsNavigatable(ed))
    );
  }
  get id() {
    return this.element.id;
  }
  get enabled() {
    return !this.element.disabled;
  }
  get sourceURL() {
    if (this.element.src) return this.element.src;
  }
  set sourceURL(e) {
    this.#I("src", () => {
      this.element.src = e ?? null;
    });
  }
  get loadingStyle() {
    return this.element.loading;
  }
  get isLoading() {
    return void 0 !== this.formSubmission || void 0 !== this.#C();
  }
  get complete() {
    return this.element.hasAttribute("complete");
  }
  set complete(e) {
    this.#I("complete", () => {
      e
        ? this.element.setAttribute("complete", "")
        : this.element.removeAttribute("complete");
    });
  }
  get isActive() {
    return this.element.isActive && this.#D;
  }
  get rootLocation() {
    let e = this.element.ownerDocument.querySelector('meta[name="turbo-root"]'),
      t = e?.content ?? "/";
    return expandURL(t);
  }
  #H(ep) {
    return this.#F.has(ep);
  }
  #I(eg, ef) {
    this.#F.add(eg), ef(), this.#F.delete(eg);
  }
  #Q(eb, eS) {
    (this.currentNavigationElement = eb),
      eS(),
      delete this.currentNavigationElement;
  }
}
function getFrameElementById(e) {
  if (null != e) {
    let t = document.getElementById(e);
    if (t instanceof FrameElement) return t;
  }
}
function activateElement(e, t) {
  if (e) {
    let r = e.getAttribute("src");
    if (null != r && null != t && urlsAreEqual(r, t))
      throw Error(
        `Matching <turbo-frame id="${e.id}"> element has a source URL which references itself`
      );
    if (
      (e.ownerDocument !== document && (e = document.importNode(e, !0)),
      e instanceof FrameElement)
    )
      return e.connectedCallback(), e.disconnectedCallback(), e;
  }
}
let StreamActions = {
  after() {
    this.targetElements.forEach((e) =>
      e.parentElement?.insertBefore(this.templateContent, e.nextSibling)
    );
  },
  append() {
    this.removeDuplicateTargetChildren(),
      this.targetElements.forEach((e) => e.append(this.templateContent));
  },
  before() {
    this.targetElements.forEach((e) =>
      e.parentElement?.insertBefore(this.templateContent, e)
    );
  },
  prepend() {
    this.removeDuplicateTargetChildren(),
      this.targetElements.forEach((e) => e.prepend(this.templateContent));
  },
  remove() {
    this.targetElements.forEach((e) => e.remove());
  },
  replace() {
    this.targetElements.forEach((e) => e.replaceWith(this.templateContent));
  },
  update() {
    this.targetElements.forEach((e) => {
      (e.innerHTML = ""), e.append(this.templateContent);
    });
  },
  refresh() {
    session.refresh(this.baseURI, this.requestId);
  },
};
class StreamElement extends HTMLElement {
  static async renderElement(e) {
    await e.performAction();
  }
  async connectedCallback() {
    try {
      await this.render();
    } catch (e) {
      console.error(e);
    } finally {
      this.disconnect();
    }
  }
  async render() {
    return (this.renderPromise ??= (async () => {
      let e = this.beforeRenderEvent;
      this.dispatchEvent(e) &&
        (await nextRepaint(), await e.detail.render(this));
    })());
  }
  disconnect() {
    try {
      this.remove();
    } catch {}
  }
  removeDuplicateTargetChildren() {
    this.duplicateChildren.forEach((e) => e.remove());
  }
  get duplicateChildren() {
    let e = this.targetElements
        .flatMap((e) => [...e.children])
        .filter((e) => !!e.id),
      t = [...(this.templateContent?.children || [])]
        .filter((e) => !!e.id)
        .map((e) => e.id);
    return e.filter((e) => t.includes(e.id));
  }
  get performAction() {
    if (this.action) {
      let e = StreamActions[this.action];
      if (e) return e;
      this.#U("unknown action");
    }
    this.#U("action attribute is missing");
  }
  get targetElements() {
    return this.target
      ? this.targetElementsById
      : this.targets
      ? this.targetElementsByQuery
      : void this.#U("target or targets attribute is missing");
  }
  get templateContent() {
    return this.templateElement.content.cloneNode(!0);
  }
  get templateElement() {
    if (null === this.firstElementChild) {
      let e = this.ownerDocument.createElement("template");
      return this.appendChild(e), e;
    }
    if (this.firstElementChild instanceof HTMLTemplateElement)
      return this.firstElementChild;
    this.#U("first child element must be a <template> element");
  }
  get action() {
    return this.getAttribute("action");
  }
  get target() {
    return this.getAttribute("target");
  }
  get targets() {
    return this.getAttribute("targets");
  }
  get requestId() {
    return this.getAttribute("request-id");
  }
  #U(ev) {
    throw Error(`${this.description}: ${ev}`);
  }
  get description() {
    return (this.outerHTML.match(/<[^>]+>/) ?? [])[0] ?? "<turbo-stream>";
  }
  get beforeRenderEvent() {
    return new CustomEvent("turbo:before-stream-render", {
      bubbles: !0,
      cancelable: !0,
      detail: { newStream: this, render: StreamElement.renderElement },
    });
  }
  get targetElementsById() {
    let e = this.ownerDocument?.getElementById(this.target);
    return null !== e ? [e] : [];
  }
  get targetElementsByQuery() {
    let e = this.ownerDocument?.querySelectorAll(this.targets);
    return 0 !== e.length ? Array.prototype.slice.call(e) : [];
  }
}
class StreamSourceElement extends HTMLElement {
  streamSource = null;
  connectedCallback() {
    (this.streamSource = this.src.match(/^ws{1,2}:/)
      ? new WebSocket(this.src)
      : new EventSource(this.src)),
      connectStreamSource(this.streamSource);
  }
  disconnectedCallback() {
    this.streamSource &&
      (this.streamSource.close(), disconnectStreamSource(this.streamSource));
  }
  get src() {
    return this.getAttribute("src") || "";
  }
}
(FrameElement.delegateConstructor = FrameController),
  void 0 === customElements.get("turbo-frame") &&
    customElements.define("turbo-frame", FrameElement),
  void 0 === customElements.get("turbo-stream") &&
    customElements.define("turbo-stream", StreamElement),
  void 0 === customElements.get("turbo-stream-source") &&
    customElements.define("turbo-stream-source", StreamSourceElement),
  (() => {
    let e = document.currentScript;
    if (e && !e.hasAttribute("data-turbo-suppress-warning"))
      for (e = e.parentElement; e; ) {
        if (e == document.body)
          return console.warn(
            unindent`
  You are loading Turbo from a <script> element inside the <body> element. This is probably not what you meant to do!

  Load your application’s JavaScript bundle inside the <head> element instead. <script> elements in <body> are evaluated with each page change.

  For more information, see: https://turbo.hotwired.dev/handbook/building#working-with-script-elements

  ——
  Suppress this warning by adding a "data-turbo-suppress-warning" attribute to: %s
`,
            e.outerHTML
          );
        e = e.parentElement;
      }
  })(),
  (window.Turbo = { ...Turbo, StreamActions }),
  start();
export {
  FetchEnctype,
  FetchMethod,
  FetchRequest,
  FetchResponse,
  FrameElement,
  FrameLoadingStyle,
  FrameRenderer,
  PageRenderer,
  PageSnapshot,
  StreamActions,
  StreamElement,
  StreamSourceElement,
  I as cache,
  clearCache,
  connectStreamSource,
  disconnectStreamSource,
  fetchWithTurboHeaders as fetch,
  fetchEnctypeFromString,
  fetchMethodFromString,
  isSafe,
  navigator$1 as navigator,
  registerAdapter,
  renderStreamMessage,
  session,
  setConfirmMethod,
  setFormMode,
  setProgressBarDelay,
  start,
  visit,
};
