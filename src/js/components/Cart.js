import { select, classNames, settings, templates } from '../settings.js';
import CartProduct from './CartProduct.js';
import utils from '../utils.js';

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
    thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
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

    /* console.log('totalNumber', thisCart.totalNumber);
    console.log('subtotalPrice', thisCart.subtotalPrice);
    console.log('totalPrice', thisCart.totalPrice); */
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
    //console.log('payload', payload);

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
export default Cart;
