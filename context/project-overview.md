# QRBid

## Overview

QRBid is a simple web-based SaaS application for creating and managing time-limited online auctions shared through QR codes or direct links. The first real-world use case is selling a parking space in a residential complex. The product is intended for international use.

Auctions are accessible to anyone who has the link, but they are not listed in a public marketplace or searchable auction catalog. A visitor can view an auction without an account; placing a bid requires registration or sign-in.

## Goals

1. Allow a registered user to create and manage an auction with minimal effort.
2. Generate a shareable auction link, QR code, and printable A4 PDF poster.
3. Let interested visitors register simply and place bids from a mobile phone or computer.
4. Show the current highest bid and remaining time, with real-time updates.
5. Accept only valid bids, including when multiple people bid simultaneously.
6. Notify the highest valid bidder and auction owner when an auction ends, with appropriate contact details for follow-up.
7. Let one account both create auctions and participate in other users' auctions.
8. Provide a bilingual user experience in English and Slovak.

## Languages and Localization

- The application supports **English (EN)** and **Slovak (SK)** for all core MVP screens and user-facing messages.
- English is the default language, with a simple language switcher to select Slovak.
- The application remembers the user's language preference.
- Auction-related emails are sent in the recipient's selected language.
- User-entered auction titles and descriptions remain in their original language; automatic translation is not part of the MVP.
- The technical internationalization implementation will be defined in `architecture-context.md`.

## Core User Flow

1. A user registers or signs in and opens **Create Auction**.
2. The owner enters an auction title, description, photos, starting price, minimum bid increment, and closing date/time.
3. The app creates a unique auction URL and QR code; the owner can share the link or download an A4 PDF poster.
4. An interested person scans the QR code or opens the link and sees the auction detail without signing in.
5. To place a bid, the visitor signs in or registers, providing their name, email address, and phone number. After authentication, they return to the same auction.
6. The bidder sees the current price, minimum next bid, countdown, and bid history, and submits a bid.
7. The system validates and saves accepted bids securely; connected visitors see updated auction information in real time.
8. At the closing time, no further bids are accepted. The highest valid bid determines the provisional winning bidder under the auction rules.
9. The highest bidder receives an email about the result; the owner receives an email with the result and the winning bidder's name and contact details.
10. Registered users can revisit **My Auctions**, **My Bids**, and **Profile**.

## Features

### Accounts and Profile

- One account can act as both auction owner and bidder.
- Registration/sign-in is required for creating auctions or placing bids.
- User profile includes name, email, and phone number.
- Exact verification and sign-in methods remain to be decided.

### Auction Creation and Management

- Auction title, description, photographs, starting price, minimum increment, and closing date/time.
- **My Auctions** lists auctions created by the user, their status, current highest bid, and bid count.
- Owners can open an auction detail and manage their own auctions subject to agreed lifecycle rules.

### Auction Discovery and Sharing

- Every auction has a unique shareable URL and QR code.
- A printable A4 PDF poster is available.
- No public auction directory or marketplace search in the MVP.
- Anyone with a link can view the auction without registration; the link is shareable and is not a privacy guarantee.

### Bidding

- Registered users can submit bids on other users' auctions.
- Auction detail shows current highest bid, remaining time, minimum next bid, and bid history.
- Accepted bid updates appear in real time.
- Server-side validation enforces bid amounts, auction closing time, and safe concurrent bidding.
- **My Bids** lists auctions in which the user has participated.

### Auction Results and Email

- Auctions stop accepting bids when their closing time is reached.
- The highest valid bidder is identified according to the agreed rules.
- The bidder receives a result email.
- The owner receives a result email with the winning bidder's name, email, and phone number for follow-up.
- If there are no valid bids, the auction ends without a winner.
- The legal effect of bids and the wording of winner notifications must be confirmed before launch.

### Main Screens

- Home
- Auction Detail
- Create Auction
- My Auctions
- My Bids
- Profile
- Sign In / Sign Up

**My Auctions** and **My Bids** may be combined into one simple dashboard with tabs.

## Scope

### In Scope (MVP)

- User accounts and profiles
- Auction creation and basic owner management
- Photos and time-limited auctions
- Unique auction links, QR codes, and printable PDF posters
- Link-based auction viewing without registration
- Authenticated bidding and bid history
- Secure transactional bid acceptance and real-time updates
- My Auctions and My Bids
- Auction result emails and winner contact handoff
- Responsive, mobile-first interface
- English and Slovak localization, language preference, and localized result emails

### Out of Scope (MVP)

- Public auction catalog and marketplace search
- Online payments or automatic settlement
- Automatic/proxy bidding
- Advanced analytics
- Dedicated professional auction-house features
- Native mobile applications
- Microservices and unnecessary external infrastructure

## Open Product Decisions

1. How will email and phone number verification work during registration?
2. Can an auction owner bid on their own auction? (Recommendation: no.)
3. Can an accepted bid be withdrawn or edited? (Recommendation: no.)
4. What happens when two bids have the same amount or arrive near the deadline?
5. Is the closing time fixed, or does a last-minute bid extend it?
6. What auction lifecycle states and owner editing/cancellation rules are needed?
7. What contact information can be shown to other participants, and when?
8. Which additional notifications, if any, are necessary for the MVP?
9. Are bids legally binding offers, or non-binding expressions of interest? What wording is appropriate?
10. How will the SaaS eventually charge auction creators? (Not required for the first MVP.)

## Success Criteria

1. A user can create an auction and generate a working QR code and printable PDF poster.
2. A visitor can scan the QR code and view the correct auction on a phone without registering.
3. A new visitor can register and return to the auction to place a valid bid.
4. Invalid, late, and conflicting bids are handled correctly and safely.
5. Connected participants see the current auction state update without manual refresh under normal conditions.
6. The auction closes at the configured time and correctly identifies the highest valid bidder, or no winner if there were no bids.
7. The winner and owner receive the appropriate result emails, including winner contact details for the owner.
8. One registered user can create auctions, participate in other auctions, and access My Auctions, My Bids, and Profile.
9. Users can switch between English and Slovak, retain their preference, and receive auction result emails in their chosen language.
