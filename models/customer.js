"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }


  /** Search customer by name. */

  static async search(name) {
    const cName = name.split(' ');
    let results;
    if (cName.length === 2) {
      results = await db.query(
        `SELECT id,
        first_name AS "firstName",
                last_name  AS "lastName",
                phone,
                notes
                FROM customers
                WHERE UPPER(first_name) ILIKE $1 OR UPPER(last_name) ILIKE $2`,
        [`${cName[0]}%`, `%${cName[1]}%`]
      );

    } else {
      results = await db.query(
        `SELECT id,
          first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
                  FROM customers
                  WHERE UPPER(first_name) ILIKE $1 OR UPPER(last_name) ILIKE $1`,
        [`%${cName[0]}%`]
      );
    }
    return results.rows.map(c => new Customer(c));
    // const results = await db.query(
    //   `SELECT id,
    //     first_name AS "firstName",
    //             last_name  AS "lastName",
    //             phone,
    //             notes
    //             FROM customers
    //             WHERE concat(first_name,' ', last_name) ILIKE $1`,
    //   [`%${cName[0]}%`]
    // );
  }

  /** get a customer's full name. */

  get fullName() {
    const fullName = `${this.firstName} ${this.lastName}`;
    return fullName;
  }


  /** find all customers. */
  static async all() {
    const results = await db.query(
      `SELECT id,
      first_name AS "firstName",
      last_name  AS "lastName",
      phone,
      notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
      first_name AS "firstName",
      last_name  AS "lastName",
      phone,
      notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }


  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }


  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers(first_name, last_name, phone, notes)
             VALUES($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name = $1,
      last_name = $2,
      phone = $3,
      notes = $4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
  /**Gets top ten customers with the most reservations */
  static async topTenCustomers() {
    const result = await db.query(
      `SELECT COUNT(customer_id), customer_id AS id, customers.first_name AS "firstName",
      customers.last_name AS "lastName", customers.phone, customers.notes
           FROM reservations JOIN customers ON reservations.customer_id = customers.id
           GROUP BY customer_id, customers.first_name, customers.last_name, customers.phone, customers.notes
           ORDER BY COUNT(customer_id)
           DESC LIMIT(10)
      `
    );
    const results = result.rows;
    const topTen = results.map(c => new Customer(c));
    return topTen;


  }

}

module.exports = Customer;;
