// cypress/integration/sidebar.spec.ts

describe('Sidebar Navigation', () => {
  beforeEach(() => {
    cy.visit('/dashboard'); // Assuming your ManagerDashboard route is '/manager-dashboard'
  });

  it('should render Dashboard component when Dashboard link is clicked', () => {
    cy.get('.flex.flex-col.w-64.bg-gray-800.h-screen').as('sidebar');

    cy.get('@sidebar').contains('Dashboard').click();

    cy.url().should('include', '/dashboard');
    cy.get('.ml-64').contains('Dashboard Component'); // Adjust this selector based on your Dashboard component content
  });

  it('should render Cashiers component when Cashiers link is clicked', () => {
    cy.get('.flex.flex-col.w-64.bg-gray-800.h-screen').as('sidebar');

    cy.get('@sidebar').contains('Cashiers').click();

    cy.url().should('include', '/cashiers');
    cy.get('.ml-64').contains('Cashiers Component'); // Adjust this selector based on your Cashiers component content
  });

  it('should render Branches component when Branches link is clicked', () => {
    cy.get('.flex.flex-col.w-64.bg-gray-800.h-screen').as('sidebar');

    cy.get('@sidebar').contains('Branches').click();

    cy.url().should('include', '/branches');
    cy.get('.ml-64').contains('Branches Component'); // Adjust this selector based on your Branches component content
  });

  it('should render Summary component when Summary link is clicked', () => {
    cy.get('.flex.flex-col.w-64.bg-gray-800.h-screen').as('sidebar');

    cy.get('@sidebar').contains('Summary').click();

    cy.url().should('include', '/summary');
    cy.get('.ml-64').contains('Summary Component'); // Adjust this selector based on your Summary component content
  });
});
