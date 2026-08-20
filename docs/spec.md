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

## UAP incident report

UAP-01   Filing, listing and reading UAP incident reports requires a signed-in
         user. An unauthenticated request returns 401.
UAP-02   A report belongs to the agent who filed it. Listing returns only that
         agent's reports, and requesting another agent's report returns 403.
UAP-03   A filed report can be amended or deleted, by the agent who filed it
         and by nobody else. Amending or deleting another agent's report
         returns 403, and either returns 404 when no such report exists.
UAP-04   The form requires a case number, reporting agent name, badge number,
         field office, sighting date, report date, sighting location, object
         shape, object count, observation duration, narrative, encounter
         classification, threat assessment, classification level, and the
         certification checkbox. Estimated altitude, evidence collected, media
         reference ids, additional remarks and the leadership notification are
         optional.
UAP-05   A required free-text value must be 3 to 255 characters, or 3 to 1000
         for a textarea. An optional one may be empty, and is otherwise bound
         by the same maximum.
UAP-06   Text is trimmed of leading and trailing whitespace before it is
         validated and before it is stored. A value of only whitespace counts
         as empty. Length is counted in Unicode code points.
UAP-07   The case number must match UAP-YYYY-NNNN. Filing a report with a case
         number already on file returns 409 and reports the problem against
         the case number field.
UAP-08   Neither the sighting date nor the report date may be in the future,
         and the report date may not be earlier than the sighting date. The
         ordering failure is reported against the report date.
UAP-09   Choosing "Other" as the object shape reveals a required free-text
         field describing the shape.
UAP-10   Selecting physical debris or a biological sample as evidence reveals
         a required custody chain field and a required storage location.
         Selecting photographic or audio evidence reveals an optional media
         reference field.
UAP-11   Checking "civilian witnesses were present" reveals a required witness
         count, a whole number between 1 and 999, and a required witness
         statement.
UAP-12   Encounter classification CE-2, CE-3 or CE-4 makes the physical
         effects field required; CE-1 leaves it optional. The field is visible
         in every case.
UAP-13   Encounter classification CE-3 or CE-4 reveals a required occupant
         description. CE-4 additionally reveals a required missing-time value,
         a whole number between 1 and 10080, and a required medical evaluation
         choice.
UAP-14   A threat assessment of High reveals a required escalation
         justification.
UAP-15   A field that stops applying loses its value immediately, along with
         any error shown against it, and reappears empty if it applies again.
         A value for a field that does not apply is never stored.
UAP-16   Submitting an invalid form sends no request to the server.
UAP-17   When a submission is rejected, every invalid field shows its own
         message beside it, and a summary at the top of the form states how
         many fields need attention and links to each of them.
UAP-18   When a submission is rejected, focus moves to the first invalid field
         in document order.
UAP-19   No field shows an error before the first submission attempt. After a
         rejected submission, each field that was invalid rechecks itself as
         it is edited, and its message disappears as soon as the value becomes
         valid.
UAP-20   The submit button is never disabled because the form is invalid. It
         is disabled only while a submission is in flight.
UAP-21   Character limits are not enforced by the input itself: a value longer
         than the maximum can be typed, and is reported as an error naming the
         limit and the current length.
UAP-22   A successful filing returns 201 and shows the filed report read-only,
         confirming the case number.
UAP-23   The reporting agent field opens prefilled with the signed-in user's
         name. It can be changed before filing, and the report records
         whatever the field holds when it is submitted.
UAP-24   An amendment is validated exactly as a first filing is: the same
         required fields, the same limits and the same conditional rules. A
         report cannot be amended into a state it could not have been filed
         in.
UAP-25   The amendment form opens holding the filed report, including every
         conditional field the stored answers reveal. A rejected amendment
         reports its fields the way a rejected filing does, and says that the
         changes were not saved rather than that the report was not filed.
UAP-26   Changing a report's case number to one already on file returns 409.
         Leaving its own case number unchanged is not a conflict.
UAP-27   A report records when it was amended. A report that has never been
         amended says nothing about it.
UAP-28   Deleting asks for confirmation before it acts. Cancelling leaves the
         report untouched. Confirming removes it, returns 204, and the report
         is then absent from the agent's list, returns 404 when requested, and
         its case number is free to be used again.
UAP-29   Both forms offer a way out without submitting: filing offers the list
         of reports, and amending offers the report being amended.
