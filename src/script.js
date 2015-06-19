(function(window, document) {

  var namespace = 'zacc';

  var selector = namespace;
  var headings = document.getElementsByClassName(selector);
  var ANIMATION_TIME = 680;
  var modernizr = window.Modernizr;
  var velocity = window.Velocity;
  var supportsVelocity = !!window.Velocity;
  var supportCSSmasks = !!modernizr ? modernizr.cssmask : getCSSmasksSupport();

  console.log('supportsVelocity', supportsVelocity);

  /**
   * Get CSS masks support
   * @return {void}
   */
  function getCSSmasksSupport () {
    var html = document.getElementsByTagName('html')[0];
    var _addHtmlClass = function (prop, supported) {
      html.className += supported ? prop + ' ' : 'no-' + prop + ' ';
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
   * @return {void}
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
    this.$heading = heading;
    this.$content = null;
    this.height = 0;

    this.create();
    this.collapse(supportsVelocity);
    if (!supportsVelocity) {
      this.setCSStransition();
    }
    this.bindMouse();
    this.bindKeyboard();
  }

  /**
   * Set CSS transition
   *
   * on load don't show the collapse animation, just quickly collapse
   * all the content, wait a bit and then set the animation (not through css)
   * @@doubt
   */
  Accordion.prototype.setCSStransition = function () {
    var time = ANIMATION_TIME / 1000 + 's';
    window.setTimeout(function() {
      this.$content.style.transition = 'margin-top ' + time + ' ease';
    }.bind(this), 5);
  }

  /**
   * Create
   * @return {void}
   */
  Accordion.prototype.create = function () {
    var heading = this.$heading;
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
    this.$headingWrap = headingWrap;
    this.$content = content;
    this.$contentWrap = contentWrap;

    // calculate accordion content height
    this.height = contentWrap.offsetHeight;
  }

  /**
   * Bind mouse
   * @return {void}
   */
  Accordion.prototype.bindMouse = function () {
    this.$heading.addEventListener('click', this.toggle.bind(this));
  }

  /**
   * Bind keyboard
   *
   * @see https://css-tricks.com/snippets/javascript/javascript-keycodes/
   * @return {void}
   */
  Accordion.prototype.bindKeyboard = function () {
    var _onEnter = function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) { // Enter or Space
        this.toggle();
      }
    }.bind(this);
    this.$heading.addEventListener('keyup', _onEnter);
  }

  /**
   * Toggle
   * @return {void}
   */
  Accordion.prototype.toggle = function () {
    if (this.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  /**
   * Collapse start
   * @return {void}
   */
  Accordion.prototype._collapseStart = function () {
    this.$headingWrap.classList.add(namespace + '-collapsed');
    this.$headingWrap.classList.remove(namespace + '-expanded');
    this.$heading.setAttribute('aria-expanded', false);
    // immediately hide the overflow for the animation
    this.$contentWrap.style.overflow = 'hidden';
  }

  /**
   * Collapse end
   * @return {void}
   */
  Accordion.prototype._collapseEnd = function () {
    this.$contentWrap.style.display = 'none';
  }

  /**
   * Collapse
   * @return {void}
   */
  Accordion.prototype.collapse = function (dontAnimate) {

    if (dontAnimate) {
      this._collapseStart();
      this.$content.style.marginTop = -this.height + 'px';
      this.$contentWrap.style.display = 'none';
    } else {
      if (supportsVelocity) {
        // with Velocity
        Velocity(this.$content, 'stop', true);
        Velocity(this.$content, { marginTop: -this.height }, {
          duration: ANIMATION_TIME,
          // easing: [50, 15],
          begin: this._collapseStart.bind(this),
          complete: this._collapseEnd.bind(this)
        });

      } else {
        this._collapseStart();

        this.$content.style.marginTop = -this.height + 'px';

        // wait the end of the animation before to hide the content wrapper
        window.clearInterval(this.animation);
        this.animation = window.setInterval(function () {
          this._collapseEnd();
          window.clearInterval(this.animation);
        }.bind(this), ANIMATION_TIME);
      }
    }

    this.expanded = false;
  }

  /**
   * Expand start
   * @return {void}
   */
  Accordion.prototype._expandStart = function () {
    this.$headingWrap.classList.add(namespace + '-expanded');
    this.$headingWrap.classList.remove(namespace + '-collapsed');
    this.$heading.setAttribute('aria-expanded', true);
    this.$contentWrap.style.display = '';
  }

  /**
   * Expand end
   * @return {void}
   */
  Accordion.prototype._expandEnd = function () {
    this.$contentWrap.style.overflow = '';
  }

  /**
   * Expand
   * @return {void}
   */
  Accordion.prototype.expand = function () {
    if (supportsVelocity) {

      // with Velocity
      Velocity(this.$content, 'stop', true);
      Velocity(this.$content, { marginTop: 0 }, {
        display: '',
        duration: ANIMATION_TIME,
        // easing: [50, 15],
        begin: this._expandStart.bind(this),
        complete: this._expandEnd.bind(this),
      });
    } else {

      this._expandStart();
      // we need this in a timeout to make the css animation works
      window.setTimeout(function() {
        this.$content.style.marginTop = 0;
      }.bind(this), 10);

      // wait the end of the animation, then don't cut the overflow anymore
      window.clearInterval(this.animation);
      this.animation = window.setInterval(function () {
        this._expandEnd();
        window.clearInterval(this.animation);
      }.bind(this), ANIMATION_TIME);
    }

    this.expanded = true;
  }

  init();
})(window, document);