
let currentSubject = '';
let termCount = 3;

// Subject Form
document.getElementById('subjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    currentSubject = document.getElementById('subject').value.trim();
    
    if (currentSubject) {
        document.getElementById('subjectCard').classList.add('hidden');
        document.getElementById('focusTermsCard').classList.remove('hidden');
        document.getElementById('subjectDisplay').textContent = currentSubject;
    }
});
// Back button
document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('focusTermsCard').classList.add('hidden');
    document.getElementById('subjectCard').classList.remove('hidden');
});
// Add term button
document.getElementById('addTermBtn').addEventListener('click', () => {
    if (termCount >= 8) {
        alert('Maximum 8 terms recommended, any more may make the search results too narrow!');
        return;
    }
    termCount++;
    const container = document.getElementById('termInputs');
    const newTermDiv = document.createElement('div');
    newTermDiv.className = 'term-input-container';
    newTermDiv.innerHTML = `
        <div class="term-number">${termCount}</div>
        <div class="input-group">
            <label for="term${termCount}">Focus Term ${termCount}</label>
            <input 
                type="text" 
                id="term${termCount}" 
                placeholder="e.g., Additional focus area"
            />
        </div>
    `;
    container.appendChild(newTermDiv);
});
// Generate Literature Review
document.getElementById('focusTermsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect all focus terms
    const focusTerms = [];
    for (let i = 1; i <= termCount; i++) {
        const term = document.getElementById(`term${i}`).value.trim();
        if (term) {
            focusTerms.push(term);
        }
    }
    if (focusTerms.length < 3) {
        alert('Please provide at least 3 focus terms');
        return;
    }
    // Hide focus terms card, show results
    document.getElementById('focusTermsCard').classList.add('hidden');
    document.getElementById('resultsCard').classList.add('show');
    document.getElementById('loading').style.display = 'block';
    document.getElementById('resultContent').style.display = 'none';
    document.getElementById('generateBtn').disabled = true;
    try {
        // Build the search query
        const searchQuery = `${currentSubject} academic research ${focusTerms.join(' ')}`;
        
        // First, search for current research on the topic
        const searchResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4000,
                tools: [{
                    type: "web_search_20250305",
                    name: "web_search"
                }],
                messages: [{
                    role: "user",
                    content: `Search for recent academic research, papers, and scholarly articles about "${currentSubject}" with a specific focus on these areas: ${focusTerms.map((t, i) => `${i + 1}. ${t}`).join(', ')}. Find at least 5-7 current sources from the past 3 years that address these focus areas.`
                }]
            })
        });
        const searchData = await searchResponse.json();
        
        // Build conversation history with search results
        const messages = [
            {
                role: "user",
                content: `Search for recent academic research, papers, and scholarly articles about "${currentSubject}" with a specific focus on these areas: ${focusTerms.map((t, i) => `${i + 1}. ${t}`).join(', ')}. Find at least 5-7 current sources from the past 3 years that address these focus areas.`
            },
            {
                role: "assistant",
                content: searchData.content
            },
            {
                role: "user",
                content: `Based on the search results, create a comprehensive literature review on "${currentSubject}" with special emphasis on the following focus areas: ${focusTerms.map((t, i) => `${i + 1}. ${t}`).join('\n')}

                Structure your review as follows:

                1. **Introduction**: Brief overview of ${currentSubject} and its significance
                2. **Literature Review by Focus Area**: Create separate sections for each focus area:
                ${focusTerms.map(t => `   - ${t}: Synthesize findings from recent research`).join('\n')}
                3. **Integration and Connections**: Discuss how these focus areas relate to each other within the context of ${currentSubject}
                4. **Gaps and Future Directions**: Identify areas needing more research across all focus areas
                5. **Conclusion**: Summarize the current understanding

                Important:
                - Ensure each focus area (${focusTerms.join(', ')}) is thoroughly addressed with specific citations
                - Cite sources naturally throughout using author names or study descriptions
                - Focus on synthesis rather than just summarizing individual papers
                - Highlight areas of consensus and debate
                - At the end, provide a "Sources" section listing all references

                Write in a clear, professional academic style.`
            }
        ];
            const reviewResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 4000,
                    messages: messages
                })
            });
            const reviewData = await reviewResponse.json();
            
            // Extract and display the text content
            let reviewText = '';
            reviewData.content.forEach(item => {
                if (item.type === 'text') {
                    reviewText += item.text;
                }
            });
            if (reviewText) {
                // Convert markdown-style formatting to HTML
                reviewText = reviewText
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
                    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/^(.+)$/gm, '<p>$1</p>');
                const focusTermsList = focusTerms.map(t => `<li>${t}</li>`).join('');
                
                document.getElementById('resultContent').innerHTML = `
                    <h2>Literature Review: ${currentSubject}</h2>
                    <div style="background: rgba(207, 184, 124, 0.1); padding: 1em; border-radius: 8px; margin-bottom: 2em;">
                        <strong>Focus Areas:</strong>
                        <ul style="margin-top: 0.5em; padding-left: 2em;">
                            ${focusTermsList}
                        </ul>
                    </div>
                    ${reviewText}
                `;
            } else {
                throw new Error('No content generated');
            }
            // Hide loading, show results
            document.getElementById('loading').style.display = 'none';
            document.getElementById('resultContent').style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('resultContent').innerHTML = `
                <div class="error">
                    <strong>Error:</strong> Failed to generate literature review. Please try again.
                </div>
            `;
            document.getElementById('loading').style.display = 'none';
            document.getElementById('resultContent').style.display = 'block';
        } finally {
            document.getElementById('generateBtn').disabled = false;
        }
    });
