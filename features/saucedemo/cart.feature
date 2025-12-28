@saucedemo @cart
@allure.label.epic:Sauce_Demo
@allure.label.feature:Cart
@allure.label.story:Shopping_Cart
@allure.label.severity:critical
@allure.label.owner:QA_Team
Feature: SauceDemo Shopping Cart
  As a user of SauceDemo
  I want to add and remove items from my cart
  So that I can manage my purchases

  # ============================================
  # ADD SINGLE ITEM - All User Types
  # ============================================
  @add-to-cart @story:AddToCart
  Scenario Outline: <user_type> user adds single item to cart
    Given I am logged in as "<role>"
    When I add the first item to the cart
    Then the cart badge should show "1" item

    @standard
    Examples: Standard User
      | role     | user_type |
      | standard | Standard  |

    @problem
    Examples: Problem User
      | role    | user_type |
      | problem | Problem   |

    @performance
    Examples: Performance User
      | role        | user_type          |
      | performance | Performance glitch |

    @error
    Examples: Error User
      | role  | user_type |
      | error | Error     |

    @visual
    Examples: Visual User
      | role   | user_type |
      | visual | Visual    |

  # ============================================
  # STANDARD USER - Advanced Cart Operations
  # ============================================
  @standard @multiple-items @story:AddToCart
  Scenario: Standard user adds multiple items to cart
    Given I am logged in as "standard"
    When I add the first item to the cart
    And I add the second item to the cart
    Then the cart badge should show "2" items

  @standard @remove-item @story:RemoveFromCart
  Scenario: Standard user removes item from cart on inventory page
    Given I am logged in as "standard"
    When I add the first item to the cart
    And I remove the first item from cart
    Then the cart badge should not be visible

  @standard @view-cart
  Scenario: Standard user views cart contents
    Given I am logged in as "standard"
    When I add the first item to the cart
    And I click on the cart icon
    Then I should be on the cart page
    And I should see 1 item in the cart

  @standard @remove-from-cart-page
  Scenario: Standard user removes item from cart page
    Given I am logged in as "standard"
    When I add the first item to the cart
    And I click on the cart icon
    And I remove the item from cart page
    Then the cart should be empty

  @standard @continue-shopping
  Scenario: Standard user continues shopping from cart
    Given I am logged in as "standard"
    When I add the first item to the cart
    And I click on the cart icon
    And I click continue shopping
    Then I should see the inventory page

  # ============================================
  # MULTIPLE ITEMS - Parameterized
  # ============================================
  @standard @bulk-add @story:BulkAdd
  Scenario Outline: Standard user adds <count> items to cart
    Given I am logged in as "standard"
    When I add <count> items to the cart
    Then the cart badge should show "<count>" items

    @one-item
    Examples: One Item
      | count |
      | 1     |

    @two-items
    Examples: Two Items
      | count |
      | 2     |

    @three-items
    Examples: Three Items
      | count |
      | 3     |
