/*!
 * Zacc v0.0.1 (http://kuus.github.io/zacc)
 * Accordion inspired by Google Closure Zippy
 * Copyright 2015 kuus <kunderikuus@gmail.com> (http://kunderikuus.net)
 * license MIT
 */
(function(window, document) {

  /** @const */
  var namespace = 'zacc';

  var selector = namespace;
  var headings = document.getElementsByClassName(selector);
  var ANIMATION_TIME = 680;

  // libraries to maybe use
  var modernizr = window['Modernizr'];
  var $ = window['jQuery'];
  var velocity = $ ? $.Velocity || null : window['Velocity'] || null;

  // support
  var enableJquery = !!$;
  var enableVelocity = $ ? !!$.Velocity : !!velocity;
  var supportCSSmasks = !!modernizr ? modernizr.cssmask : getCSSmasksSupport();

  // Some debug
  // console.log('enableJquery', enableJquery, 'enableVelocity', enableVelocity);

  /**
   * Get CSS masks support
   * @return {boolean}
   */
  function getCSSmasksSupport () {
    var html = document.getElementsByTagName('html')[0];
    var _addHtmlClass = function (prop, supported) {
      html.className += supported ? ' ' + prop + ' ' : ' no-' + prop + ' ';
    };
    if (modernizr) {
      modernizr.addTest('cssmask', modernizr.testAllProps('maskRepeat'));
      return modernizr.cssmask;
    } else {
      var prefixes = ['webkit', 'moz', 'o', 'ms'];
      var style = document.body.style;
      for (var i = prefixes.length; i--;) {
        if (style[ prefixes[i] + 'MaskRepeat'] !== undefined) {
          _addHtmlClass('cssmask', true);
          return true;
        }
      }
      _addHtmlClass('cssmask', false);
      return false;
    }
  }

  /**
   * Init
   */
  function init () {
    if (headings) {
      for (var i = headings.length; i--;) {
        var heading = headings[i];
        if (heading) {
          var accordion = new Accordion(heading);
        }
      }
    }
  }

  /**
   * Accordion
   *
   * @constructor
   */
  function Accordion (heading) {
    this.expanded = false;
    this.__heading = heading;
    this.__content = null;
    this.height = 0;

    this._create();
    this.collapse(enableVelocity);
    if (!enableVelocity) {
      this._setCSStransition();
    }
    this._bindMouse();
    this._bindKeyboard();
  }

  /**
   * Set CSS transition
   *
   * on load don't show the collapse animation, just quickly collapse
   * all the content, wait a bit and then set the animation (not through css)
   */
  Accordion.prototype._setCSStransition = function () {
    var time = ANIMATION_TIME / 1000 + 's';
    window.setTimeout(function() {
      this.__content.style.transition = 'margin-top ' + time + ' ease';
    }.bind(this), 5);
  }

  /**
   * Create
   */
  Accordion.prototype._create = function () {
    var heading = this.__heading;
    var headingWrap = document.createElement('div');
    var content = heading.nextElementSibling;
    var contentWrap = document.createElement('div');

    // accessiblity
    heading.setAttribute('tabindex', 0);
    heading.setAttribute('role', 'tab');

    // add classes
    headingWrap.className = namespace + '-heading';
    content.className = namespace + '-content';
    contentWrap.className = namespace + '-content-wrap';

    // wrap DOM
    heading.parentNode.replaceChild(headingWrap, heading);
    headingWrap.appendChild(heading);
    content.parentNode.replaceChild(contentWrap, content);
    contentWrap.appendChild(content);

    // set DOM as props
    this.__headingWrap = headingWrap;
    this.__content = content;
    if (enableJquery) {
      this.__$content = $(content);
    }
    this.__contentWrap = contentWrap;

    // calculate accordion content height
    this.height = contentWrap.offsetHeight;
  }

  /**
   * Bind mouse
   */
  Accordion.prototype._bindMouse = function () {
    this.__heading.addEventListener('click', this.toggle.bind(this));
  }

  /**
   * Bind keyboard
   *
   * @see https://css-tricks.com/snippets/javascript/javascript-keycodes/
   */
  Accordion.prototype._bindKeyboard = function () {
    var _onEnter = function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) { // Enter or Space
        this.toggle();
      }
    }.bind(this);
    this.__heading.addEventListener('keyup', _onEnter);
  }

  /**
   * Toggle
   */
  Accordion.prototype.toggle = function () {
    if (this.expanded) {
      this.collapse(false);
    } else {
      this.expand();
    }
  }
  // @@api
  Accordion.prototype['toggle'] = Accordion.prototype.toggle;

  /**
   * Collapse start
   * @private
   */
  Accordion.prototype._collapseStart = function () {
    this.__headingWrap.classList.add(namespace + '-collapsed');
    this.__headingWrap.classList.remove(namespace + '-expanded');
    this.__heading.setAttribute('aria-expanded', false);
    // immediately hide the overflow for the animation
    this.__contentWrap.style.overflow = 'hidden';
  }

  /**
   * Collapse end
   * @private
   */
  Accordion.prototype._collapseEnd = function () {
    this.__contentWrap.style.display = 'none';
  }

  /**
   * Collapse
   */
  Accordion.prototype.collapse = function (dontAnimate) {
    var negativeHeight = -this.height;

    if (dontAnimate) {
      this._collapseStart();
      this.__content.style.marginTop = negativeHeight + 'px';
      this.__contentWrap.style.display = 'none';
    } else {
      if (enableVelocity) {
        var velocityOpts = {
          duration: ANIMATION_TIME,
          // easing: [50, 15],
          begin: this._collapseStart.bind(this),
          complete: this._collapseEnd.bind(this)
        };
        // with Velocity
        if (enableJquery) {
          this.__$content['velocity']('stop', true);
          this.__$content['velocity']({ marginTop: negativeHeight }, velocityOpts);
        } else {
          velocity(this.__content, 'stop', true);
          velocity(this.__content, { marginTop: negativeHeight }, velocityOpts);
        }

      } else {
        this._collapseStart();

        this.__content.style.marginTop = negativeHeight + 'px';

        // wait the end of the animation before to hide the content wrapper
        window.clearTimeout(this.animation);
        this.animation = window.setTimeout(this._collapseEnd.bind(this), ANIMATION_TIME);
      }
    }

    this.expanded = false;
  }
  // @@api
  Accordion.prototype['collapse'] = Accordion.prototype.collapse;

  /**
   * Expand start
   */
  Accordion.prototype._expandStart = function () {
    this.__headingWrap.classList.add(namespace + '-expanded');
    this.__headingWrap.classList.remove(namespace + '-collapsed');
    this.__heading.setAttribute('aria-expanded', true);
    this.__contentWrap.style.display = '';
  }

  /**
   * Expand end
   */
  Accordion.prototype._expandEnd = function () {
    this.__contentWrap.style.overflow = '';
  }

  /**
   * Expand
   */
  Accordion.prototype.expand = function () {
    if (enableVelocity) {
      var velocityOpts = {
        display: '',
        duration: ANIMATION_TIME,
        // easing: [50, 15],
        begin: this._expandStart.bind(this),
        complete: this._expandEnd.bind(this)
      };
      // with Velocity
      if (enableJquery) {
        this.__$content['velocity']('stop', true);
        this.__$content['velocity']({ marginTop: 0 }, velocityOpts);
      } else {
        velocity(this.__content, 'stop', true);
        velocity(this.__content, { marginTop: 0 }, velocityOpts);
      }
    } else {

      this._expandStart();
      // we need this in a timeout to make the css animation works
      window.setTimeout(function() {
        this.__content.style.marginTop = 0;
      }.bind(this), 50);

      // wait the end of the animation, then don't cut the overflow anymore
      window.clearTimeout(this.animation);
      this.animation = window.setTimeout(this._expandEnd.bind(this), ANIMATION_TIME);
    }

    this.expanded = true;
  }
  // @@api
  Accordion.prototype['expand'] = Accordion.prototype.expand;

  // @@api
  window['Zacc'] = window['Zacc'] || Accordion.prototype;

  init();

})(window, document);