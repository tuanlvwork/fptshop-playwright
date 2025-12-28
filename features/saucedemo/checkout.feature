@saucedemo @checkout
@allure.label.epic:Sauce_Demo
@allure.label.severity:critical
@allure.label.owner:QA_Team
Feature: Checkout
  As a user of SauceDemo
  I want to complete the checkout process
  So that I can purchase my selected items

  # ============================================
  # SUCCESSFUL CHECKOUT - Multiple Users
  # ============================================
  @smoke @complete-checkout @story:HappyPathCheckout
  Scenario Outline: <user_type> user completes full checkout flow
    Given I am logged in as "<role>"
    When I add the first item to the cart
    And I click on the cart icon
    And I proceed to checkout
    And I fill in checkout information with "<first_name>" "<last_name>" "<postal_code>"
    And I continue checkout
    Then I should see the checkout overview page
    When I finish checkout
    Then I should see the order confirmation

    @standard
    Examples: Standard User
      | role     | user_type | first_name | last_name | postal_code |
      | standard | Standard  | John       | Doe       | 12345       |

    @performance
    Examples: Performance User
      | role        | user_type          | first_name | last_name | postal_code |
      | performance | Performance glitch | Slow       | User      | 99999       |

  # ============================================
  # STANDARD USER - Checkout Workflow
  # ============================================
  @standard @order-summary @story:OrderValidation
  Scenario: Standard user sees order summary before completing
    Given I am logged in as "standard"
    When I add the first item to the cart
    And I click on the cart icon
    And I proceed to checkout
    And I fill in checkout information with "Jane" "Smith" "54321"
    And I continue checkout
    Then I should see the item total
    And I should see the tax
    And I should see the total price

  @standard @cancel-checkout @cancel-at-info @story:CancelCheckout
  Scenario: Standard user cancels checkout at information step
    Given I am logged in as "standard"
    When I add the first item to the cart
    And I click on the cart icon
    And I proceed to checkout
    And I cancel checkout
    Then I should be on the cart page

  @standard @cancel-checkout @cancel-at-overview @story:CancelCheckout
  Scenario: Standard user cancels checkout at overview step
    Given I am logged in as "standard"
    When I add the first item to the cart
    And I click on the cart icon
    And I proceed to checkout
    And I fill in checkout information with "John" "Doe" "12345"
    And I continue checkout
    And I cancel checkout
    Then I should see the inventory page

  # ============================================
  # CHECKOUT VALIDATION - Negative Scenarios
  # ============================================
  @standard @negative @validation @story:CheckoutValidation
  Scenario Outline: Checkout fails with <validation_error>
    Given I am logged in as "standard"
    When I add the first item to the cart
    And I click on the cart icon
    And I proceed to checkout
    And I fill in checkout information with "<first_name>" "<last_name>" "<postal_code>"
    And I continue checkout
    Then I should see the checkout error "<error_message>"

    @missing-firstname
    Examples: Missing First Name
      | validation_error | first_name | last_name | postal_code | error_message          |
      | empty first name |            | Doe       | 12345       | First Name is required |

    @missing-lastname
    Examples: Missing Last Name
      | validation_error | first_name | last_name | postal_code | error_message         |
      | empty last name  | John       |           | 12345       | Last Name is required |

    @missing-postalcode
    Examples: Missing Postal Code
      | validation_error  | first_name | last_name | postal_code | error_message           |
      | empty postal code | John       | Doe       |             | Postal Code is required |

  # ============================================
  # ERROR USER - Checkout Issues
  # ============================================
  @error @negative @checkout-error
  Scenario: Error user encounters issue during checkout
    Given I am logged in as "error"
    When I add the first item to the cart
    And I click on the cart icon
    And I proceed to checkout
    And I fill in checkout information with "John" "Doe" "12345"
    And I continue checkout
    And I finish checkout
    Then I should see an error during checkout or order confirmation
