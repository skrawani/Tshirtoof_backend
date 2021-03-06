import React, { useState, useEffect, useContext } from "react";
import { isAutheticated } from "../auth/helper";
import { cartCounter, cartEmpty, loadCart } from "./helper/cartHelper";
import { Link } from "react-router-dom";
import StripeCheckoutButton from "react-stripe-checkout";
import { API } from "../backend";
import { createOrder } from "./helper/orderHelper";
import { CartCountContext } from "../CartCountContext";
import { useHistory } from "react-router-dom";
const StripeCheckout = ({
  products,
  setReload = (f) => f,
  reload = undefined,
}) => {
  const [data, setData] = useState({
    loading: false,
    success: false,
    error: "",
    address: " ",
  });

  const userId = isAutheticated() && isAutheticated().user._id;
  const utoken = isAutheticated() && isAutheticated().token;
  const { cartCount, setCartCount } = useContext(CartCountContext);
  const history = useHistory();
  const getFinalPrice = () => {
    return products.reduce((curr, next) => {
      return curr + next.price * next.count;
    }, 0);
  };

  const makePayment = (token) => {
    const body = {
      token,
      products,
      amount: totAmountincluTax() * 100,
    };
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    return fetch(`${API}/stripepayment`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
      .then((response) => {
        console.log(response);
        response.json().then((data) => {
          console.log(data);
          const orderData = {
            products: products,
            amount: data.amount / 100,
            transaction_id: data.id,
          };
          alert("Thanks for Shopping");
          createOrder(userId, utoken, orderData);
          clearCart();
          setTimeout(() => {
            history.push("/");
          }, 1000);
        });
      })
      .catch((err) => console.log(err));
  };

  const clearCart = () => {
    cartEmpty(() => {
      console.log("Cart Cleared");
    });
    setReload(!reload);
    setCartCount(cartCounter());
  };

  const showStipeButton = () => {
    return isAutheticated() ? (
      <StripeCheckoutButton
        stripeKey={process.env.REACT_APP_KEY}
        token={makePayment}
        amount={totAmountincluTax() * 100}
        name="Buy Tshirts"
        currency="inr"
        billingAddress
        shippingAddress
      >
        <button className="btn  btn-success btn-block rounded mt-1">
          Pay ₹ {round2(totAmountincluTax())}
        </button>
      </StripeCheckoutButton>
    ) : (
      <Link to="/signin">
        <button className="btn btn-warning btn-block rounded mt-1">
          Sign In to Continue
        </button>
      </Link>
    );
  };
  const getTaxes = () => {
    const taxPrecentage = 18;
    return getFinalPrice() * (taxPrecentage / 100);
  };

  const totAmountincluTax = () => {
    return getFinalPrice() + getTaxes();
  };

  const round2 = (x) => {
    return x.toFixed(2);
  };

  return (
    <div>
      <h5 className="text-white">No of items in cart : {cartCount}</h5>
      <div
        className="container-fluid bg-info p-4"
        style={{ fontSize: "0.75rem" }}
      >
        <div className="bg-white rounded">
          <div className="row ">
            <div className="col-2 text-dark"></div>

            <div className="col-7 my-1 text-left text-dark">Name</div>
            <div className="col-3  my-1 text-left text-dark">Price</div>
          </div>
          {products.length && <div>HI</div>}
          {products.map((prod, i) => (
            <div key={i} className="list-group-item d-flex lh-condensed">
              <div className="col-1 text-dark">{i + 1}</div>
              <div className="col-6 text-dark text-left">{prod.name}</div>
              <div className="col-12 col-sm-2 col-md-2 text-dark text-left">
                ₹ {prod.price} * {prod.count}
              </div>
              <div className="col-3 mb-3 ml-1 ml-sm-3 ml-md-3 text-dark text-left">
                ₹ {round2(prod.price * prod.count)}
              </div>
            </div>
          ))}
          <div className="list-group-item d-flex lh-condensed">
            <div className="col-1"></div>
            <div className="col-8 text-dark text-left">18% GST</div>
            <div className="col-3 mb-3  text-dark text-left">
              + ₹ {round2(getTaxes())}
            </div>
          </div>
          <div className="list-group-item d-flex lh-condensed">
            <div className="col-1"></div>
            <div className="col-8 text-dark text-left">Total Price</div>
            <div className="col-3 mb-3  ml-3  text-dark text-left">
              ₹ {round2(totAmountincluTax())}
            </div>
          </div>
        </div>
      </div>
      {showStipeButton()}
      <button
        className="btn  btn-danger btn-block rounded mt-1
      "
        onClick={clearCart}
      >
        Clear Cart
      </button>
    </div>
  );
};

export default StripeCheckout;
