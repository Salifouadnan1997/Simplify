const fs = require('fs');

let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf-8');

// Move recaptcha-container outside motion.div
code = code.replace(
`          {/* Invisible reCAPTCHA container */}
          <div id="recaptcha-container"></div>
        </motion.div>
      </div>
    </div>`,
`        </motion.div>
      </div>
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>`
);

fs.writeFileSync('src/components/AuthPage.tsx', code);
