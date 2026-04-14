describe('End-to-End Test: Login and Navigate to Manager Dashboard', () => {
  it('should login successfully and navigate to Manager Dashboard', () => {
    cy.visit('/'); // Visit the login page

    cy.get('input[type="text"]').type('ttt@gmail.com');
    cy.get('input[type="password"]').type('12345');
    cy.get('button').click();

    cy.intercept(
      'POST',
      'http://localhost:8081/lifepill/v1/auth/authenticate'
    ).as('loginRequest');
    cy.wait('@loginRequest').then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);

      cy.url().should('include', '/dashboard');

      cy.get('.sidebar').should('be.visible');
      cy.get('.dashboard').should('be.visible');
      cy.get('.cashier').should('not.exist');
      cy.get('.branches').should('not.exist');
      cy.get('.summary').should('not.exist');

      cy.get('.sidebar').contains('Dashboard').click();
      cy.get('.dashboard').should('be.visible');

      cy.get('.sidebar').contains('Branches').click();
      cy.get('.branches').should('be.visible');

      cy.get('.sidebar').contains('Cashiers').click();
      cy.get('.cashier').should('be.visible');

      cy.get('.sidebar').contains('Summary').click();
      cy.get('.summary').should('be.visible');
    });
  });
});
