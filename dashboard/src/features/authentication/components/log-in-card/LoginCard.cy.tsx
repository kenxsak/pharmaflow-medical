describe('LogInCard', () => {
  it('should display the login form', () => {
    cy.intercept('POST', '/api/login', {}).as('loginRequest');

    cy.visit('/');
    cy.get('h1').should('contain.text', 'Login');
    cy.get('input[type="text"]').should('have.attr', 'placeholder', 'Username');
    cy.get('input[type="password"]').should(
      'have.attr',
      'placeholder',
      'Password'
    );
    cy.get('button').should('contain.text', 'Login');
  });

  it('should allow users to input username and password', () => {
    cy.visit('your-login-page-url');
    cy.get('input[type="text"]').type('exampleuser');
    cy.get('input[type="password"]').type('password123');
    cy.get('input[type="text"]').should('have.value', 'exampleuser');
    cy.get('input[type="password"]').should('have.value', 'password123');
  });

  it('should successfully log in with valid credentials', () => {
    const validUsername = 'validUser';
    const validPassword = 'validPassword';
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: { token: 'validToken' }, // Assuming your backend returns a token on successful login
    }).as('loginRequest');

    cy.visit('your-login-page-url');
    cy.get('input[type="text"]').type(validUsername);
    cy.get('input[type="password"]').type(validPassword);
    cy.get('button').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');
  });

  // Add more tests for loading state, error handling, etc.
});
