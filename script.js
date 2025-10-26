// Helper function to format numbers with commas
function formatNumber(num) {
    // Ensure the number is rounded to the nearest integer before formatting
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to update the total material and mark cost display
function updateCosts() {
    const materialCostPerUnit = parseFloat(document.getElementById('materialCostPerUnit').value) || 0;
    const materialQuantity = parseFloat(document.getElementById('materialQuantity').value) || 0;
    const markCostPerUnit = parseFloat(document.getElementById('markCostPerUnit').value) || 0;
    const markQuantity = parseFloat(document.getElementById('markQuantity').value) || 0;

    const totalMaterialCost = materialCostPerUnit * materialQuantity;
    const totalMarkCost = markCostPerUnit * markQuantity;

    document.getElementById('materialTotalCost').textContent = `Total Material Cost: ${formatNumber(totalMaterialCost)} Crystals`;
    document.getElementById('markTotalCost').textContent = `Total Blessing Mark Cost: ${formatNumber(totalMarkCost)} Crystals`;
}

// Attach event listeners to input fields to update costs dynamically
document.addEventListener('DOMContentLoaded', () => {
    const inputs = [
        'materialCostPerUnit', 'materialQuantity',
        'markCostPerUnit', 'markQuantity',
        'baseSuccessRate', 'markSuccessBonus', 'failureBonus', 'vip3Active'
    ];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateCosts);
            element.addEventListener('change', updateCosts); // For checkbox
        }
    });
    // Initial cost update on load
    updateCosts();
});

function calculateUpgrade() {
    // 1. Get all user inputs
    const baseSuccessRate = parseFloat(document.getElementById('baseSuccessRate').value) / 100 || 0;
    const materialCostPerUnit = parseFloat(document.getElementById('materialCostPerUnit').value) || 0;
    const materialQuantity = parseFloat(document.getElementById('materialQuantity').value) || 0;
    const markCostPerUnit = parseFloat(document.getElementById('markCostPerUnit').value) || 0;
    const markQuantity = parseFloat(document.getElementById('markQuantity').value) || 0;
    const markSuccessBonus = parseFloat(document.getElementById('markSuccessBonus').value) / 100 || 0;
    const failureBonus = parseFloat(document.getElementById('failureBonus').value) / 100 || 0;
    const vip3Active = document.getElementById('vip3Active').checked;

    // Constants
    const VIP_BONUS = vip3Active ? 0.05 : 0; // Assuming VIP 3 gives +5% (0.05) as a common community value

    // 2. Calculate Costs
    const totalMaterialCost = materialCostPerUnit * materialQuantity;
    const totalMarkCost = markCostPerUnit * markQuantity;

    // 3. Calculate Success Rates
    // Total bonus rate without marks
    const totalBonusNoMark = failureBonus + VIP_BONUS;
    // Total bonus rate with marks
    const totalBonusWithMark = failureBonus + VIP_BONUS + markSuccessBonus;

    // Rate without Blessing Mark
    const rateNoMark = Math.min(1, baseSuccessRate + totalBonusNoMark);

    // Rate with Blessing Mark
    const rateWithMark = Math.min(1, baseSuccessRate + totalBonusWithMark);

    // Ensure mark quantity is not zero for calculations involving marks
    if (markQuantity === 0) {
        document.getElementById('result').innerHTML = `<h2>Error: Mark Quantity is Zero</h2><p>Please enter the quantity of Blessing Marks required for the upgrade to perform the calculation.</p>`;
        document.getElementById('result').className = 'recommendation-not-worth';
        return;
    }

    // 4. Calculate Expected Cost per Success (ECPS)
    // ECPS = Total Cost / Success Rate

    // Expected Cost per Success (ECPS) without Marks
    const ecpsNoMark = totalMaterialCost / rateNoMark;

    // Expected Cost per Success (ECPS) with Marks (using current mark price)
    const ecpsWithMark = (totalMaterialCost + totalMarkCost) / rateWithMark;

    // 5. Calculate Break-Even Price per Mark
    // We want ECPS_NoMark = ECPS_WithMark
    // Material_Cost / Rate_NoMark = (Material_Cost + Mark_Cost) / Rate_WithMark
    // Where Mark_Cost = BreakEven_Price * Mark_Quantity

    // Rearranging the formula to solve for BreakEven_Price:
    // BreakEven_Price = (Material_Cost * (Rate_WithMark / Rate_NoMark - 1)) / Mark_Quantity

    let breakEvenPrice = 0;
    if (rateNoMark > 0 && rateWithMark > rateNoMark) {
        breakEvenPrice = (totalMaterialCost * ((rateWithMark / rateNoMark) - 1)) / markQuantity;
    } else if (rateNoMark === 0 && rateWithMark > 0) {
        // Special case: 0% base rate, but marks give a chance
        breakEvenPrice = Infinity; // Marks are infinitely valuable
    } else {
        // If Rate_WithMark <= Rate_NoMark (e.g., mark bonus is 0 or rates are 100%)
        breakEvenPrice = 0;
    }

    // 6. Determine Recommendation and Analysis
    let recommendation = "";
    let analysis = "";
    let isWorth = false;

    if (rateNoMark >= 1) {
        recommendation = "Success is Guaranteed (No Marks Needed)";
        analysis = `Your base rate (${(baseSuccessRate * 100).toFixed(1)}%) + bonuses already reach 100% or more. Do not use Blessing Marks. Total attempt cost: ${formatNumber(totalMaterialCost)} Crystals.`;
        isWorth = true; // Technically worth it, but marks are not needed.
    } else {
        const breakEvenPriceDisplay = formatNumber(breakEvenPrice);

        if (ecpsWithMark < ecpsNoMark) {
            recommendation = "Recommended - Use Blessing Marks";
            analysis = `The **Expected Cost per Success (ECPS)** is lower when using Blessing Marks.
            <ul>
                <li>**ECPS with Marks:** ${formatNumber(ecpsWithMark)} Crystals (Success Rate: ${(rateWithMark * 100).toFixed(1)}%)</li>
                <li>**ECPS without Marks:** ${formatNumber(ecpsNoMark)} Crystals (Success Rate: ${(rateNoMark * 100).toFixed(1)}%)</li>
            </ul>
            **Conclusion:** At the current market price of ${formatNumber(markCostPerUnit)} Crystals per Mark, using Marks is the more cost-efficient approach.`;
            isWorth = true;
        } else {
            recommendation = "Not Recommended - Do Not Use Blessing Marks";
            analysis = `The **Expected Cost per Success (ECPS)** is higher when using Blessing Marks.
            <ul>
                <li>**ECPS with Marks:** ${formatNumber(ecpsWithMark)} Crystals (Success Rate: ${(rateWithMark * 100).toFixed(1)}%)</li>
                <li>**ECPS without Marks:** ${formatNumber(ecpsNoMark)} Crystals (Success Rate: ${(rateNoMark * 100).toFixed(1)}%)</li>
            </ul>
            **Conclusion:** The cost of the Blessing Marks does not justify the increase in success rate. It is more economical to sell the Marks and attempt the upgrade without them.`;
            isWorth = false;
        }

        // Add the break-even price analysis
        if (breakEvenPrice > 0 && breakEvenPrice !== Infinity) {
            analysis += `<hr>
            <h3>Break-Even Price Analysis</h3>
            <p>Blessing Marks would become economically worth it if their price was **${breakEvenPriceDisplay} Crystals or less** per Mark.
            (Current Price: ${formatNumber(markCostPerUnit)} Crystals)</p>`;
        } else if (breakEvenPrice === Infinity) {
            analysis += `<hr>
            <h3>Break-Even Price Analysis</h3>
            <p>Since your base success rate is 0%, Marks are infinitely valuable as they provide the only chance of success (assuming Mark Bonus > 0).</p>`;
        } else if (breakEvenPrice <= 0 && rateWithMark > rateNoMark) {
             analysis += `<hr>
            <h3>Break-Even Price Analysis</h3>
            <p>Due to the current market values and upgrade parameters, Marks are not worth it even at 1 Crystal each. This usually happens when the increase in success rate is too small relative to the material cost.</p>`;
        }
    }

    // 7. Display Result
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <h2>${recommendation}</h2>
        <p>${analysis}</p>
        <p><strong>Total Mark Cost for Attempt:</strong> ${formatNumber(totalMarkCost)} Crystals</p>
        <p><strong>Success Rate Increase from Marks:</strong> +${(markSuccessBonus * 100).toFixed(1)}%</p>
    `;
    resultDiv.className = isWorth ? 'recommendation-worth' : 'recommendation-not-worth';

    // Special case for guaranteed success
    if (rateNoMark >= 1) {
        resultDiv.className = 'recommendation-worth';
    }
}
