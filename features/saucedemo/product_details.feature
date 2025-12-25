@saucedemo @product
Feature: SauceDemo Product Details
  As a user of SauceDemo
  I want to view product details
  So that I can learn more about products before purchasing

  # ============================================
  # VIEW PRODUCT DETAILS - Multiple Users
  # ============================================
  @view-details
  Scenario Outline: <user_type> user views product detail page
    Given I am logged in as "<role>"
    When I click on the first product name
    Then I should be on the product detail page
    And I should see the product name
    And I should see the product description
    And I should see the product price

    @standard
    Examples: Standard User
      | role     | user_type |
      | standard | Standard  |

    @problem
    Examples: Problem User
      | role    | user_type |
      | problem | Problem   |

    @visual
    Examples: Visual User
      | role   | user_type |
      | visual | Visual    |

  # ============================================
  # STANDARD USER - Product Actions
  # ============================================
  @standard @add-from-detail
  Scenario: Standard user adds product from detail page
    Given I am logged in as "standard"
    When I click on the first product name
    And I add product to cart from detail page
    Then the cart badge should show "1" item

  @standard @back-navigation
  Scenario: Standard user navigates back from product detail
    Given I am logged in as "standard"
    When I click on the first product name
    And I click back to products
    Then I should see the inventory page

  # ============================================
  # PRODUCT ELEMENTS VERIFICATION
  # ============================================
  @standard @element-verification
  Scenario Outline: Standard user verifies <element> on product detail page
    Given I am logged in as "standard"
    When I click on the first product name
    Then I should see the <element>

    @verify-name
    Examples: Product Name
      | element      |
      | product name |

    @verify-description
    Examples: Product Description
      | element             |
      | product description |

    @verify-price
    Examples: Product Price
      | element       |
      | product price |

    @verify-button
    Examples: Add to Cart Button
      | element            |
      | add to cart button |

    @verify-image
    Examples: Product Image
      | element       |
      | product image |

  # ============================================
  # VISUAL USER - Image Verification
  # ============================================
  @visual @image-check
  Scenario: Visual user verifies product image is displayed
    Given I am logged in as "visual"
    When I click on the first product name
    Then I should see the product image
