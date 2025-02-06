export class MessageHydrator {
    private container: HTMLElement;
    private thinkingElement: HTMLElement | null = null;
    private responseElement: HTMLElement | null = null;
    private tokenBuffer: string[] = [];
    private isThinking: boolean = false;
    private updateScheduled: boolean = false;

    private static readonly THINK_START = '<think>';
    private static readonly THINK_END = '</think>';

    constructor(container: HTMLElement) {
        this.container = container;
        this.initializeElements();
    }

    private initializeElements() {
        this.container.innerHTML = '';

        // Create and append thinking section with accordion styling
        const thinkingHTML = `
          <div class="mb-4 transition-all duration-200" style="display: none;" data-testid="thinking-section">
            <button class="thinking-gradient-border w-full text-left rounded-lg border bg-gray-100 px-4 py-2 font-medium hover:bg-gray-200 focus:outline-none flex items-center gap-2 relative overflow-hidden group" 
                    onclick="this.nextElementSibling.classList.toggle('hidden'); 
                            this.querySelector('.chevron-right')?.classList.toggle('hidden');
                            this.querySelector('.chevron-down')?.classList.toggle('hidden');
                            this.classList.toggle('rounded-b-none')"
            >
              <svg class="chevron-right w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              <svg class="chevron-down w-4 h-4 hidden" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              <span>Thinking Process</span>
            </button>
            <div class="hidden border-x border-b border-gray-200 rounded-b-lg">
              <div class="px-4 py-2 text-sm text-gray-600" data-testid="thinking-content"></div>
            </div>
          </div>
        `;

        // Response section
        const responseHTML = `<div data-testid="response-content"></div>`;

        this.container.insertAdjacentHTML('beforeend', thinkingHTML);
        this.container.insertAdjacentHTML('beforeend', responseHTML);

        // Get references to elements
        this.thinkingElement = this.container.querySelector('[data-testid="thinking-section"]');
        this.responseElement = this.container.querySelector('[data-testid="response-content"]');

        // Verify elements exist
        if (!this.thinkingElement || !this.responseElement) {
            console.error('Failed to initialize elements:', {
                thinking: this.thinkingElement,
                response: this.responseElement,
                container: this.container.innerHTML
            });
            throw new Error('Failed to initialize DOM elements');
        }
    }

    public appendToken(token: string) {
        if (!token) return;

        // Queue token instead of immediate processing
        this.tokenBuffer.push(token);

        // Schedule update if not already scheduled
        if (!this.updateScheduled) {
            this.updateScheduled = true;
            requestAnimationFrame(() => this.processTokens());
        }
    }

    private processTokens() {
        try {
            const currentBuffer = this.tokenBuffer.join('');
            const startIndex = currentBuffer.indexOf(MessageHydrator.THINK_START);
            const endIndex = currentBuffer.indexOf(MessageHydrator.THINK_END);

            console.log(this.responseElement);

            if (startIndex === -1) {
                this.scheduleContentUpdate(this.responseElement!, currentBuffer);
            }

            if (endIndex === -1) {
                const strippedBuffer = currentBuffer.substring(0, startIndex) +
                    currentBuffer.substring(startIndex + MessageHydrator.THINK_START.length);
                this.isThinking = true;
                this.scheduleContentUpdate(this.thinkingElement!, strippedBuffer);
            } else {
                // There was thinking content and not just empty tags
                if (this.isThinking) {
                    this.isThinking = false;
                    this.scheduleContentUpdate(this.thinkingElement!, currentBuffer.slice(startIndex + MessageHydrator.THINK_START.length, endIndex));
                }

                const content = currentBuffer.slice(endIndex + MessageHydrator.THINK_END.length);
                this.scheduleContentUpdate(this.responseElement!, content);
            }
        } catch (error) {
            console.error('Error processing tokens:', error);
            this.tokenBuffer = [];
        } finally {
            this.updateScheduled = false;
        }
    }

    getAndClearBuffer() {
        const buffer = this.tokenBuffer.join('');
        this.tokenBuffer = [];
        return buffer;
    }

    private scheduleContentUpdate(element: HTMLElement, content: string) {
        if (!element) return;

        // Batch DOM updates using requestAnimationFrame
        requestAnimationFrame(() => {
            if (element.textContent !== content) {
                element.textContent = content;
            }
        });
    }
}