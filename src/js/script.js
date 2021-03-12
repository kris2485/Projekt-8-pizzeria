/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  ('use strict');

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
    },
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 10,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };
  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      //console.log('new Product:', thisProduct);
      //console.log(thisProduct.id);
      //console.log(thisProduct.data);
    }
    renderInMenu() {
      const thisProduct = this;
      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }
    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
    initAccordion() {
      const thisProduct = this;
      /* find the clickable trigger (the element that should react to clicking) */
      /* const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable); same reference at getElements */

      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        /* prevent default action for event */
        event.preventDefault();
        /* find active product (product that has active class) */
        const activeProducts = document.querySelectorAll('.product.active');
        //console.log(activeProducts);
        /* if there is active product and it's not thisProduct.element, remove class active from it */
        for (let activeProduct of activeProducts) {
          if (activeProduct != thisProduct.element) {
            activeProduct.classList.remove('active');
          }
        }
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle('active');
      });
    }
    initOrderForm() {
      const thisProduct = this;
      //console.log(thisProduct.initOrderForm);
      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }
    processOrder() {
      const thisProduct = this;
      /* console.log(thisProduct.processOrder); */
      const formData = utils.serializeFormToObject(thisProduct.form);
      //console.log('formData', formData);
      // set price to default price
      let price = thisProduct.data.price;
      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        //console.log(paramId, param);
        // for every option in this category
        for (let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          //console.log(optionId, option);
          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          // check if there is param with a name of paramId in formData and if it includes optionId
          if (optionSelected) {
            // check if the option is not default
            if (!option.default == true) {
              // add option price to price variable
              price += option.price;
            }
          } else {
            // check if the option is default
            if (option.default == true) {
              // reduce price variable
              price -= option.price;
            }
          }
          if (optionImage !== null) {
            if (optionSelected) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }
      thisProduct.priceSingle = price;
      /* multiply price by amount */
      price *= thisProduct.amountWidget.value;
      // update calculated price in the HTML
      thisProduct.priceElem.innerHTML = price;
    }
    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }
    addToCart() {
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }
    prepareCartProduct() {
      const thisProduct = this;

      const productSummary = {};
      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = thisProduct.priceSingle * thisProduct.amountWidget.value;
      productSummary.params = thisProduct.prepareCartProductParams();

      return productSummary;
    }
    prepareCartProductParams() {
      const thisProduct = this;

      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};

      // for every category (param)
      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
        params[paramId] = {
          label: param.label,
          options: {},
        };

        for (let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          if (optionSelected) {
            params[paramId].options[optionId] = option.label;
          }
        }
      }
      return params;
    }
    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }
  }
  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      thisWidget.value = settings.amountWidget.defaultValue;
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();

      //console.log('AmountWidget:', thisWidget);
      //console.log('constructor arguments:', element);
    }
    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value) {
      const thisWidget = this;

      const newValue = parseInt(value);
      /* TO DO: Add validation */
      if (thisWidget.value !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
        thisWidget.value = newValue;
        thisWidget.announce();
      }

      thisWidget.input.value = thisWidget.value;
    }
    initActions() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    announce() {
      const thisWidget = this;

      const event = new CustomEvent('updated', {
        bubbles: true,
      });
      thisWidget.element.dispatchEvent(event);
    }
  }
  class Cart {
    constructor(element) {
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
      //console.log('new Cart', thisCart);
    }
    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    }
    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function () {
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function (event) {
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisCart.sendOrder();
      });
    }
    add(menuProduct) {
      const thisCart = this;
      const thisProduct = this;
      const generatedHTML = templates.cartProduct(menuProduct);
      const generateDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generateDOM);
      //console.log('adding product', menuProduct);
      thisCart.products.push(new CartProduct(menuProduct, generateDOM));
      //console.log('thisCart.products', thisCart.products);
      thisCart.update();
    }
    update() {
      const thisCart = this;
      let deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
      for (let product of thisCart.products) {
        thisCart.totalNumber = thisCart.totalNumber + product.amount;
        thisCart.subtotalPrice = thisCart.subtotalPrice + product.price;
      }
      thisCart.totalPrice = thisCart.totalNumber * thisCart.subtotalPrice + deliveryFee;
      if (thisCart.totalNumber == 0) {
        thisCart.totalPrice = 0;
        deliveryFee = 0;
      }
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;

      for (let price of thisCart.dom.totalPrice) {
        price.innerHTML = thisCart.totalPrice;
      }

      console.log('totalNumber', thisCart.totalNumber);
      console.log('subtotalPrice', thisCart.subtotalPrice);
      console.log('totalPrice', thisCart.totalPrice);
    }
    remove(cartProduct) {
      const thisCart = this;
      cartProduct.dom.wrapper.remove();
      const indexOfProduct = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(indexOfProduct, 1);

      thisCart.update();
    }
    sendOrder() {
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.order;
      let deliveryFee = settings.cart.defaultDeliveryFee;

      const payload = {};

      payload.address = thisCart.dom.address.value;
      payload.phone = thisCart.dom.phone.value;
      payload.totalPrice = thisCart.totalPrice;
      payload.subtotalPrice = thisCart.subtotalPrice;
      payload.totalNumber = thisCart.totalNumber;
      payload.deliveryFee = deliveryFee;
      payload.products = [];
      console.log('payload', payload);

      for (let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      /* fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }); */
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      fetch(url, options)
        .then(function (response) {
          return response.json();
        })
        .then(function (parasedResponse) {
          console.log('parasedresponse', parasedResponse);
        });
    }
  }
  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
      //console.log('new CartProduct', thisCartProduct);
    }
    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }
    initAmountWidget() {
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }
    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
      console.log('remove');
    }
    initActions() {
      const thisCartProduct = this;
      thisCartProduct.dom.edit.addEventListener('click', function (event) {
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function (event) {
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
    getData() {
      const thisCartProduct = this;

      thisCartProduct.productData = {};
      thisCartProduct.productData.id = thisCartProduct.id;
      thisCartProduct.productData.amount = thisCartProduct.amount;
      thisCartProduct.productData.price = thisCartProduct.price;
      thisCartProduct.productData.priceSingle = thisCartProduct.priceSingle;
      thisCartProduct.productData.name = thisCartProduct.name;
      thisCartProduct.productData.params = thisCartProduct.params;

      return thisCartProduct.productData;
    }
  }
  const app = {
    initMenu: function () {
      const thisApp = this;
      //console.log('thisApp.data:', thisApp.data);
      for (let productData in thisApp.data.products) {
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
    initData: function () {
      const thisApp = this;
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.product;

      fetch(url)
        .then(function (rawResponse) {
          return rawResponse.json();
        })
        .then(function (parasedResponse) {
          console.log('parasedResponse', parasedResponse);

          /* save pasrasedResponse as thissApp.data.products */
          thisApp.data.products = parasedResponse;
          /* execute initMenu method */
          thisApp.initMenu();
        });
      console.log('thisApp.data', JSON.stringify(thisApp.data));
    },
    initCart: function () {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
    init: function () {
      const thisApp = this;
      /*console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates); */
      thisApp.initData();
      thisApp.initCart();
    },
  };
  app.init();
}
