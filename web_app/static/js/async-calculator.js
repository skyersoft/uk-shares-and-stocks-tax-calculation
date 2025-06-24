// Async calculator module for handling background calculations
const AsyncCalculator = {
    /**
     * Submit a calculation request
     * @param {FormData} formData Form data containing file and tax year
     * @returns {Promise<Object>} Task information
     */
    async submitCalculation(formData) {
        const response = await fetch('/api/calculate', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit calculation');
        }
        
        return response.json();
    },

    /**
     * Check the status of a calculation task
     * @param {string} taskId The task ID to check
     * @returns {Promise<Object>} Task status information
     */
    async checkTaskStatus(taskId) {
        const response = await fetch(`/api/task/${taskId}/status`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to check task status');
        }
        
        return response.json();
    },

    /**
     * Get the results of a completed calculation
     * @param {string} taskId The task ID to get results for
     * @returns {Promise<Object>} Calculation results
     */
    async getTaskResults(taskId) {
        const response = await fetch(`/api/task/${taskId}/results`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get task results');
        }
        
        return response.json();
    },

    /**
     * Poll for task completion
     * @param {string} taskId The task ID to poll
     * @param {Function} onProgress Callback for progress updates
     * @param {number} interval Poll interval in milliseconds
     * @returns {Promise<Object>} Final calculation results
     */
    async pollForCompletion(taskId, onProgress, interval = 1000) {
        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    const status = await this.checkTaskStatus(taskId);
                    
                    if (onProgress) {
                        onProgress(status);
                    }
                    
                    if (status.status === 'completed') {
                        const results = await this.getTaskResults(taskId);
                        resolve(results);
                        return;
                    }
                    
                    if (status.status === 'failed') {
                        reject(new Error(status.error || 'Calculation failed'));
                        return;
                    }
                    
                    // Continue polling
                    setTimeout(poll, interval);
                } catch (error) {
                    reject(error);
                }
            };
            
            // Start polling
            poll();
        });
    }
};
