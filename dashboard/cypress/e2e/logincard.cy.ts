describe('LogInCard', () => {
  beforeEach(() => {
    // Visit the root URL where the login page is located
    cy.visit('/');
  });

  it('should display the login form with username and password inputs', () => {
    // Check if the login form elements are displayed correctly
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
    // Type valid username and password in the input fields
    cy.get('input[type="text"]').type('exampleuser');
    cy.get('input[type="password"]').type('password123');

    // Check if the input fields have the correct values
    cy.get('input[type="text"]').should('have.value', 'exampleuser');
    cy.get('input[type="password"]').should('have.value', 'password123');
  });

  it('should display loading state while logging in', () => {
    cy.intercept(
      'POST',
      'http://localhost:8081/lifepill/v1/auth/authenticate',
      {}
    ).as('loginRequest');

    cy.get('input[type="text"]').type('exampleuser');
    cy.get('input[type="password"]').type('password123');
    cy.get('button').click();

    cy.get('button').should('contain.text', 'Loading...');

    cy.wait('@loginRequest');
  });

  it('should successfully log in with valid credentials', () => {
    // Set valid username and password
    const validUsername = 'tharindu@gmail.com';
    const validPassword = 'password123';

    cy.intercept(
      'POST',
      'http://localhost:8081/lifepill/v1/auth/authenticate',
      {
        statusCode: 200,
        body: {
          authenticationResponse: {
            message: 'Successfully logged in.',
            access_token:
              'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0aGFyaW5kdUBnbWFpbC5jb20iLCJhdXRob3JpdGllcyI6IlJPTEVfT1dORVIiLCJpYXQiOjE3MTU0OTU3NzEsImV4cCI6MTcxNTU4MjE3MX0.JT2YmO8CTqKyHxMEkQ5J0dt0KjTcCrg4a3T8R1wLKJg',
          },
          employerDetails: {
            employerId: 196,
            branchId: 0,
            employerNicName: 'tharindu',
            employerFirstName: 'Tharindu',
            employerLastName: 'Jayasooriya',
            employerEmail: 'tharindu@gmail.com',
            employerPhone: null,
            employerAddress: '123 Main Street, City',
            employerSalary: 50000.0,
            employerNic: '123456789V',
            gender: 'MALE',
            dateOfBirth: '1989-12-31T18:30:00.000+00:00',
            role: 'OWNER',
            pin: 0,
            profileImage: null,
            activeStatus: true,
          },
        },
      }
    ).as('loginRequest');

    cy.get('input[type="text"]').type(validUsername);
    cy.get('input[type="password"]').type(validPassword);
    cy.get('button').click();

    cy.wait('@loginRequest').then((interception) => {
      const { authenticationResponse, employerDetails } =
        interception.response?.body;
      expect(authenticationResponse.message).to.equal(
        'Successfully logged in.'
      );
      expect(authenticationResponse.access_token).to.be.a('string');
      expect(employerDetails.employerId).to.equal(196);
      expect(employerDetails.branchId).to.equal(0);
      expect(employerDetails.employerNicName).to.equal('tharindu');
      cy.url().should('include', '/dashboard');
    });
  });

  it('should display error message for invalid credentials', () => {
    const invalidUsername = 'invalidUser';
    const invalidPassword = 'invalidPassword';

    cy.intercept(
      'POST',
      'http://localhost:8081/lifepill/v1/auth/authenticate',
      {
        statusCode: 401,
        body: {
          code: 401,
          message: 'Authentication failed: Incorrect username or password',
          data: null,
        },
      }
    ).as('loginRequest');

    cy.get('input[type="text"]').type(invalidUsername);
    cy.get('input[type="password"]').type(invalidPassword);
    cy.get('button').click();

    cy.wait('@loginRequest').then((interception) => {
      const body = interception.response?.body;
      expect(body.code).to.equal(401);
      expect(body.message).to.equal(
        'Authentication failed: Incorrect username or password'
      );
      expect(body.data).to.be.null;
    });
  });
});
