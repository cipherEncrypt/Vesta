use near_sdk::{env, near, AccountId, NearToken, Promise};

#[near(contract_state)]
pub struct AutopilotVault {
    owner: AccountId,
    spending: String,
    savings: String,
    max_per_run: String,
    last_run: String,
}

impl Default for AutopilotVault {
    fn default() -> Self {
        Self {
            owner: "uninitialized".parse().unwrap(),
            spending: "0".into(),
            savings: "0".into(),
            max_per_run: "0".into(),
            last_run: "0".into(),
        }
    }
}

#[derive(near_sdk::serde::Serialize, schemars::JsonSchema)]
#[serde(crate = "near_sdk::serde")]
pub struct VaultState {
    pub spending: String,
    pub savings: String,
    #[serde(rename = "maxPerRun")]
    pub max_per_run: String,
    #[serde(rename = "lastRun")]
    pub last_run: String,
}

#[near]
impl AutopilotVault {
    #[init]
    pub fn init(owner: AccountId, max_per_run: String) -> Self {
        assert!(!max_per_run.is_empty(), "maxPerRun required");
        assert!(max_per_run.parse::<u128>().unwrap_or(0) > 0, "maxPerRun must be positive");
        env::log_str(&format!("AutopilotVault init owner={owner} maxPerRun={max_per_run}"));
        Self {
            owner,
            spending: "0".into(),
            savings: "0".into(),
            max_per_run,
            last_run: "0".into(),
        }
    }

    #[payable]
    pub fn deposit(&mut self) {
        let attached = env::attached_deposit();
        assert!(attached > NearToken::from_yoctonear(0), "Deposit must attach NEAR");
        let spending = attached
            .as_yoctonear()
            .saturating_add(self.spending.parse().unwrap_or(0));
        self.spending = spending.to_string();
        env::log_str(&format!("deposit; spending={}", self.spending));
    }

    pub fn auto_save(&mut self, amount: String) {
        let amt: u128 = amount.parse().expect("amount must be numeric string");
        assert!(amt > 0, "amount must be positive");
        assert!(amt <= self.max_per_run.parse::<u128>().unwrap(), "amount exceeds maxPerRun");
        let spend: u128 = self.spending.parse().unwrap();
        assert!(amt <= spend, "amount exceeds spending balance");
        self.spending = (spend - amt).to_string();
        let savings: u128 = self.savings.parse().unwrap();
        self.savings = (savings + amt).to_string();
        self.last_run = env::block_timestamp().to_string();
        env::log_str(&format!(
            "auto_save {amount}; spending={} savings={}",
            self.spending, self.savings
        ));
    }

    pub fn withdraw(&mut self, amount: String) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner,
            "Only owner can withdraw"
        );
        let amt: u128 = amount.parse().expect("amount must be numeric string");
        assert!(amt > 0, "amount must be positive");
        let savings: u128 = self.savings.parse().unwrap();
        assert!(amt <= savings, "insufficient savings");
        self.savings = (savings - amt).to_string();
        let _ = Promise::new(self.owner.clone()).transfer(NearToken::from_yoctonear(amt));
        env::log_str(&format!("withdraw {amount} to {}", self.owner));
    }

    pub fn get_state(&self) -> VaultState {
        VaultState {
            spending: self.spending.clone(),
            savings: self.savings.clone(),
            max_per_run: self.max_per_run.clone(),
            last_run: self.last_run.clone(),
        }
    }
}
