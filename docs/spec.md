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
