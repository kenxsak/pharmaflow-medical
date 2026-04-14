describe('End-to-End Test: Login and Navigate to Dashboard Components', () => {
  it('should login successfully, navigate to the dashboard, and check components', () => {
    cy.visit('/'); // Visit the login page

    // Fill in the username and password fields and click Login
    cy.get('input[type="text"]').type('ttt@gmail.com');
    cy.get('input[type="password"]').type('12345');
    cy.get('button').click();

    // Wait for the login request to complete
    cy.intercept(
      'POST',
      'http://localhost:8081/lifepill/v1/auth/authenticate'
    ).as('loginRequest');
    cy.wait('@loginRequest').then((interception) => {
      // Check if the login was successful
      expect(interception.response?.statusCode).to.equal(200);

      // Check if the URL redirects to the Dashboard page
      cy.url().should('include', '/dashboard');

      // Verify that the Main Dashboard components are rendered
      cy.get('.dashboard').should('be.visible');
      cy.get('.summary-cards').should('be.visible');
      cy.get('.sales-bar-chart').should('be.visible');
      cy.get('.order-pie-chart').should('be.visible');
    });
  });
});
