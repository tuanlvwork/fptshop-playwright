@saucedemo @sorting
@allure.label.epic:Sauce_Demo
@allure.label.feature:Product_Sorting
@allure.label.story:Sorting
@allure.label.severity:minor
@allure.label.owner:QA_Team
Feature: SauceDemo Product Sorting
  As a user of SauceDemo
  I want to sort products by different criteria
  So that I can find products more easily

  # ============================================
  # STANDARD USER - All Sorting Options
  # ============================================
  @standard @story:SortProducts
  Scenario Outline: Standard user sorts products by <sort_option>
    Given I am logged in as "standard"
    When I sort products by "<sort_option>"
    Then products should be sorted by "<sort_option>"

    @sort-az
    Examples: Sort A to Z
      | sort_option   |
      | Name (A to Z) |

    @sort-za
    Examples: Sort Z to A
      | sort_option   |
      | Name (Z to A) |

    @sort-price-low
    Examples: Sort Price Low to High
      | sort_option         |
      | Price (low to high) |

    @sort-price-high
    Examples: Sort Price High to Low
      | sort_option         |
      | Price (high to low) |

  # ============================================
  # MULTIPLE USERS - Sorting Functionality
  # ============================================
  Scenario Outline: <user_type> user can sort products by price
    Given I am logged in as "<role>"
    When I sort products by "Price (low to high)"
    Then products should be sorted by "Price (low to high)"

    @standard @sort-price
    Examples: Standard User
      | role     | user_type |
      | standard | Standard  |

    @performance @sort-price
    Examples: Performance User
      | role        | user_type          |
      | performance | Performance glitch |

  # ============================================
  # PROBLEM USER - Sorting (may have issues)
  # ============================================
  @problem
  Scenario Outline: Problem user attempts to sort products by <sort_option>
    Given I am logged in as "problem"
    When I sort products by "<sort_option>"
    Then the sort dropdown should show "<sort_option>"

    @problem-sort-az
    Examples: Sort A to Z
      | sort_option   |
      | Name (A to Z) |

    @problem-sort-za
    Examples: Sort Z to A
      | sort_option   |
      | Name (Z to A) |
