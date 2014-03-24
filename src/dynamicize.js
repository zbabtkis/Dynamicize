/**
 * Dynamicize
 *  - A simple tool to build dynamic HTML content without a lick of JavaScript!
 * ----
 * Well, you still have to run Dynamicize.start(), but that's it!
 * 
 * @author Zachary Babtkis <zackbabtkis@gmail.com>
 * @license WTFPL
 * 
 * ====================================================================
 *         DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
 *                  Version 2, December 2004 
 *
 * Copyright (C) 2004 Sam Hocevar <sam@hocevar.net> 
 *
 * Everyone is permitted to copy and distribute verbatim or modified 
 * copies of this license document, and changing it is allowed as long 
 * as the name is changed. 
 *
 *           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
 * TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION 
 *
 * 0. You just DO WHAT THE FUCK YOU WANT TO.
 * ====================================================================
 */
 
;(function(exports, $) {
  // Just some util functions.
  var ut = {
    
    /**
     * get type of object in [object Type] string
     * @param {Object} o - object to check
     * @return {String} type of object.
     */
    typeOf: function(o) {
      return Object.prototype.toString.call(o);
    },
  
    /**
     * Check if object is a types
     * @param {Object} o - object to check type on
     * @param {String} t - type object should be (capitalized)
     */
    isType: function(o, t) {
      return this.typeOf(o) === '[object ' + t + ']';
    },
  
    /**
     * Check if object is type in array of types
     * @param {Object} o - object to check
     * @param {Array} ts - array of type Strings
     * @return {Bool} whether it is of one of the types.
     */
    isInTypes: function(o, ts) {
      for (var i in ts) {
        if (this.isType(o, ts[i])) {
          return true;
        }
      }
    },
  
    /**
     * Get number of key=>value pairs in object.
     * @param {Object} o
     * @return number of keys
     */
    objectLength: function(o) {
      return Object.keys(o).length;
    }
  };
  
  /**
   * Object binder constructor
   * @param initial attributes to watch -- this can change later
   */
  function ObjectBinder(attributes) {
    this.observers = {};
    this.attributes = attributes;
  };
  
  /**
   * Perform digest
   *  - Run all observer functions that exist for changed values
   * @param {Object} changes - changes resulting from Object.observe
   */
  ObjectBinder.prototype._digest = function(changes) {
    var _this = this;
  
    for (var i = 0, l = changes.length; i < l; i++) {
      (this.observers[changes[i].name] || []).forEach(function(o) {
        o.call(_this, changes[i].object[changes[i].name]);
      });
    }
  };
  
  /**
   * Get nested property value on object recursively
   *  - Similar to Angular's parse method
   * @param {Object} o - object to retrieve nested property from
   * @param {String} n - period delimited link to nested property
   *  - eg. name.lastName
   * @param {String} d (optional) - delimeter to use in parse.
   * @return parsed value
   */
  ObjectBinder.prototype.parse = function(o, n, d) {
    var DELIMETER = d || '.';
    var breakage = n.split(DELIMETER);
  
    switch(breakage.length) {
      
    case 1:
      
      // If only nested one level, return that property immediately.
      return o[breakage[0]];
      
    case 0:
      // If object its self is target, return object.
      return o;
      
    default:
    
      // Recursively seek for property
      return this.parse(o[breakage[0]], breakage.slice(0, 1).join(DELIMETER));
      
    }
  }
  
  /**
   * Get property 
   *  - async -- this property doesn't have to exist on object yet
   * @param {String} a - attribute name (can be nested)
   *  - See parse method
   */
  ObjectBinder.prototype.get = function(a) {
    var _this = this;
  
    // Split on . so we can watch top level property using digest.
    var layered = a.split('.');
  
    // API to bind and unbind data to a DOM element
    return {
      /**
       * Bind data from async attribute to DOM element
       * @param {JqueryElemnt} - el - element to insert data into.
       * @return {Function} function to remove as observer.
       */
      bindToDom: function(el) {
        
        /**
         * This gets called when data changes on source.
         * @param {Anything} val - current value of watched property.
         */
        var populate = function(val) {
          if (layered.length > 1) {
            // Start searching recursively for nested attribute.
            val = _this.parse(val, layered.slice(1).join('.'));
          }
  
          el.html(val);
        };
  
        // Add binding to digest cycle.
        _this.bindFunction(layered[0], populate);
  
        return populate;
      },
  
      /**
       * Remove data binding
       * @param {Function} fn - function to remove from digest.
       */
      unbindFromDom: function(fn) {
        var index = this.observers[a].indexOf(fn);
  
        delete this.observers[a];
      }
    };
  };
  
  /**
   * Change attributes of object binder instance
   * @param {String|Number|Object|Array} key - either the key to change or the 
   *  entire value of attributes.
   * @param {Object|String|Number|Array} val (optional) - value of attribute.
   */
  ObjectBinder.prototype.set = function(key, val) {
    
    // if only key is set, assume we want to replace attributes.
    if (!val) {
      
      // Replace attributes with new values.
      $.extend(this.attributes, key);
    } else {
      
      // Set attribute value.
      this.attributes[key] = val;
    }
  };
  
  /**
   * Add attribute watcher to digest cycle
   * @param {String} a - attribute name to watch
   * @param {Function} fn - function to call when attribute changes
   */
  ObjectBinder.prototype.bindFunction = function(a, fn) {
    
    // Create callback registry for attribute name if it doesn't
    // exist already.
    this.observers[a] = this.observers[a] || [];
    
    // Add watcher to registry.
    this.observers[a].push(fn);
  
    // If not already observing attributes, start observing.
    if (ut.objectLength(this.observers) === 1 && !this.observing) {
      Object.observe(this.attributes, this._digest.bind(this));
      
      // Could be useful later on, but not using now.
      this.observing = true;
    }
  };
  
  /**
   * Automatically loads JSON from url (key) and updates ObjectBinder attributes
   * @param {Object} ctrls - url=>callback pairs to bind ajax data to DOM element.
   * @param {Number} refreshRate (optional) - how often to refresh data with AJAX call.
   */
  var AjaxController = function(ObjectBinder, ctrls, refreshRate) {
    var o
      , _this = this;

    // Start all ajax observers.
    for (var url in ctrls) {
      o = new ObjectBinder({});
  
      // Load data into object binder.
      this.loadData(url, o);
      
      // If we are refreshing, start interval.
      if(refreshRate) {
        setInterval(function() {
          _this.loadData(url, o);
        }, refreshRate);
      }
  
      // Call watcher callback with object binder.
      ctrls[url].call({}, o);
    }
  };
  
  /**
   * Load data via AJAX into data binder
   * @param {String} url - URL to send GET request to.
   * @param {DataBinder} o - Object to set data on.
   */
  AjaxController.prototype.loadData = function(url, o) {
    $.ajax(url)
      .then(function(response) {
        o.set(response);
      });
  };
  
  /**
   * Searches for elements in DOM section that are 'dynamic'
   * @param {JqueryElement} section - element to search for dynamic content in
   *  - usually $(document.body)
   */
  var DomController = function(section) {
    
    // Start data binding on any els that have  a 'data-src' attribute.
    section.find('[data-src]').each(this._dynamicize.bind(this));
  };
  
  // Simple way to start of DOM updates without using 'new' or section
  DomController.start = function() {
    new DomController($(document.body));
  };

  // Public Errors to use
  DomController.errors = {
    ErrorNoController: function(name) {
      Error.call(this);
      this.message = "No data controller exists for: " + name;
    }
  };

  DomController.errors.ErrorNoController.prototype = Object.create(Error.prototype);

  // Holds all data loading controllers
  DomController.dataControllers = {}; 

  DomController.prototype.loadController = function(ctrl) {
    var Ctrl = DomController.dataControllers[ctrl];
    if(!Ctrl) {
      throw new DomController.errors.ErrorNoController(ctrl);
    }

    return Ctrl;
  };

  /**
   * Add data loading controller as alternative to default AjaxController
   * @param {String} key - name of controller
   * @param {Function} Ctrl - controller
   */
  DomController.registerLoadMethod = function(key, Ctrl) {

  	// Cache Ctrl function.
  	var _Ctrl = Ctrl;

  	Ctrl = function(ctrls, refreshRate) {
		return new _Ctrl(ObjectBinder, ctrls, refreshRate);
	};

  	DomController.dataControllers[key] = Ctrl;
  };
  
  /**
   * Start dynamically updating data on elements based on attributes.
   * @param {Number} i - index
   * @param {JqueryElement} ctx - element to start binding
   */
  DomController.prototype._dynamicize = function(i, ctx) {
    var bindings = {}
      , $this    = $(ctx)

	  // Should default to AJAX if no data-ctrl set
      , Ctrl     = this.loadController($this.data('ctrl') || 'ajax');
    
    // Create new controller with data.src as URL
    bindings[$this.data('src')] = function(p) {
      
      // Bind (data.attr) attribute to this element.
      if($this.data('attr')) {
        p.get($this.data('attr')).bindToDom($this);
      } else {
        // Load data into sub components
        $this.find('[data-attr]').each(function(i, el) {
          p.get($(this).data('attr')).bindToDom($(this));
        });
      }
    };
    
    // Build controller with update frequency.
    new Ctrl(bindings, $this.data('update') || this.updateFreq);
  };

  // This is the default way to laod data.
  DomController.registerLoadMethod('ajax', AjaxController);
  
  exports.Dynamicize = DomController;
}).call(this, this, jQuery);
