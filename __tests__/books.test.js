process.env.NODE_ENV = "test"

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async ()=>{
    let res = await db.query(`INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('012345', 'https://amazon.com/book', 'Test Author', 'English', 50, 'Publisher', 'My First Book', 2024) 
        RETURNING isbn`);
    book_isbn = res.rows[0].isbn;
});

describe("POST /books", function (){
    test("Create new book", async function (){
        const res = await request(app).post(`/books`).send({
            isbn: '7654321',
            amazon_url: 'https://amazon.com/book2',
            author: 'John Doe',
            language: 'Italian',
            pages: 500,
            publisher: 'Italian Publishers',
            title: 'The Italian Cookbook',
            year: 2004
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.book).toHaveProperty('isbn');
    });

    test("Adding book without required title", async function (){
        const res = await request(app).post(`/books`).send({
            language: 'French',
        });
        expect(res.statusCode).toBe(400);
    });
});

describe("GET /books", function (){
    test("Get list of book", async function (){
        const res = await request(app).get(`/books`);
        const books = res.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty('isbn');
        expect(books[0]).toHaveProperty('title');
    });
});

describe("GET /books/:isbn", function (){
    test("Get book with isbn", async function (){
        const res = await request(app).get(`/books/${book_isbn}`);
        expect(res.body.book).toHaveProperty("isbn");
        expect(res.body.book.isbn).toBe(book_isbn);
    });

    test("404 if book not found", async function (){
        const res = await request(app).get(`/books/100`);
        expect(res.statusCode).toBe(404);
    });
});

describe("PUT /books/:isbn", function (){
    test("Update book with isbn", async function (){
        const res = await request(app).put(`/books/${book_isbn}`).send({
            amazon_url: 'https://amazon.com/updatedBook',
            author: 'Test',
            language: 'German',
            pages: 1000,
            publisher: 'German Publishers',
            title: 'Book Updated',
            year: 2010
        });
        expect(res.body.book).toHaveProperty('isbn');
        expect(res.body.book.title).toBe('Book Updated');
    });

    test("404 if book not found", async function (){
        const res = await request(app).get(`/books/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe("DELETE /books/:isbn", function (){
    test("Deletes book with isbn", async function (){
        const res = await request(app).delete(`/books/${book_isbn}`);
        expect(res.body).toEqual({message: "Book deleted"});
    });
});

afterEach(async function (){
    await db.query(`DELETE FROM books`);
});

afterAll(async function (){
    await db.end();
});
