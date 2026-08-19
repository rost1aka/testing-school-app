# Product specification

This document defines intended behaviour. Anything the application does that
contradicts a clause below is a defect, and every bug report must cite the
clause it violates.

## Authentication

AUTH-01  Registration requires an email address, a name, and a password of at
         least 10 characters containing an uppercase letter, a lowercase letter
         and a digit. Registering an email that already exists returns 409.
AUTH-02  Passwords are stored only as a salted hash and are never included in
         any API response.
AUTH-03  A successful sign-in issues an access token valid for 15 minutes and a
         refresh token valid for 30 days, both as HttpOnly cookies.
AUTH-04  A failed sign-in returns 401 with an identical status and body whether
         or not the email address is registered.
AUTH-05  Refreshing a session issues a new refresh token and revokes the one
         presented. A revoked or expired refresh token returns 401.
AUTH-06  After signing in from a page that required authentication, the user
         returns to that page rather than to the home page.
AUTH-07  A password-reset token is single-use and expires 15 minutes after it is
         issued. Redeeming it invalidates all other active sessions for that
         account.
AUTH-08  When the API rejects a form field, the message for that field is shown
         beside the field it refers to, not only as a single summary message.
AUTH-09  Signing out revokes the refresh token on the server. A session cannot
         be restored after signing out.
AUTH-10  A forgot-password request returns 202 whether or not the address is
         registered, and reveals nothing about which addresses exist.
AUTH-11  While a user is signed in, the application header shows their name and
         offers a way to sign out, and does not offer links to sign in or to
         register. While no user is signed in, the header offers those links and
         shows neither a name nor a way to sign out.

## Profile and addresses

USER-01  GET /users/me returns the signed-in user's profile: id, email, name,
         phone, role and creation date.
USER-02  A user may read and modify only their own profile. Requesting another
         user's id returns 403.
USER-03  PATCH /users/me updates only the fields supplied in the request body.
USER-04  Addresses belong to a user, who may list, create, update and delete
         only their own. A user has at most one default address at any time.
USER-05  Every form input has a label that is programmatically associated with
         it, so assistive technology announces the field it belongs to.

## Catalogue

CAT-01   GET /products returns the catalogue. Each product carries its id,
         slug, name, description, price, the percentage off it if any, the
         price after that discount, its image, its stock, and the categories
         it belongs to.
CAT-02   A search term matches a product whose name contains it, ignoring
         case.
CAT-03   A category filter returns only the products in that category. A
         product may belong to more than one category.
CAT-04   GET /categories lists every category with its slug and name.
CAT-05   Filters combine. A request naming both a category and a price range
         returns only the products that satisfy both constraints.
CAT-06   minPrice and maxPrice are inclusive bounds on a product's price: a
         product priced at exactly a bound is included.
CAT-07   Sorting by price orders products by price as a number, ascending or
         descending. Products of equal price keep a stable order between
         pages.
CAT-08   The catalogue is paginated at 12 products a page, and reports the
         page, the page size, how many products match and how many pages
         there are. The number of pages is the number of matching products
         divided by the page size and rounded up, so every matching product
         is on a page that can be reached.
CAT-09   Changing any filter returns the visitor to page 1.
CAT-10   While the catalogue is loading, the page says so. It does not report
         that no products were found before the results have arrived.

## Cart

CART-01  A visitor who is not signed in has a cart of their own, identified by
         a cookie, and it is still there when they come back to the page.
CART-02  Adding to the cart requires a product that exists and a quantity of
         at least 1.
CART-03  Adding a product already in the cart increases the quantity of the
         existing line; it never creates a second line.
CART-04  Setting a line's quantity to 0, or deleting the line, removes it from
         the cart.
CART-05  Signing in adds the cart built while signed out to the account's
         cart: quantities of the same product are added together, and nothing
         that was in either cart is lost.
CART-06  Amounts are whole cents. A line's total is the unit price times the
         quantity, and a percentage discount is taken from that line total and
         rounded to the nearest cent — never taken off each unit and then
         multiplied by the quantity.
CART-07  The cart reports, for each line, its unit price, quantity, line total
         and discount, and for the cart as a whole, the subtotal, the total
         discount and the amount payable.
CART-08  The number of items shown beside the cart matches what the cart holds
         after every change, including after a line is removed.
CART-09  A cart may only be changed by whoever it belongs to. A line id that
         is not in the requester's own cart is answered exactly as one that
         does not exist.
CART-10  Adding a product to the cart is confirmed where the visitor is
         looking: the control says the add is under way while it is and cannot
         send a second one, and the product then shows how many of it the cart
         holds.

## Home page

HOME-01  The home page tells a visitor who is not signed in what the application
         is and offers links to sign in and to register. For a signed-in user it
         greets them by name and links to their profile and their addresses.
HOME-02  The home page also shows the catalogue, with the same products,
         search, filters, sorting and pagination as the catalogue page, and
         shows it whether or not anyone is signed in.
