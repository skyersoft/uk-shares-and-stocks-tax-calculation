# CloudFront Content Security Policy Configuration

The `frame-ancestors` directive in CSP cannot be set via HTML `<meta>` tags and must be configured at the server/CDN level. Here's how to properly configure CSP headers in CloudFront.

## Current Issue
- Google AdSense requires loading scripts from `https://fundingchoicesmessages.google.com/`
- We've added this to our meta CSP, but for complete security, we should also configure it at CloudFront level

## CloudFront CSP Header Configuration

### Option 1: Via AWS Console (Recommended)

1. **Go to CloudFront Console**
   - Navigate to: https://console.aws.amazon.com/cloudfront/
   - Select distribution: `E3CPZK9XL7GR6Q`

2. **Create Response Headers Policy**
   - Go to "Policies" → "Response headers"
   - Click "Create response headers policy"
   - Name: `adsense-csp-policy`

3. **Configure Security Headers**
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagservices.com https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https://pagead2.googlesyndication.com https://www.google.com https://www.gstatic.com https://tpc.googlesyndication.com; frame-src https://www.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; connect-src 'self' https://pagead2.googlesyndication.com https://www.google.com; frame-ancestors 'self'
   ```

4. **Attach to Distribution**
   - Go back to your distribution
   - Edit the default behavior
   - Under "Response headers policy", select `adsense-csp-policy`
   - Save changes

### Option 2: Via AWS CLI

```bash
# Create the response headers policy
aws cloudfront create-response-headers-policy \
  --response-headers-policy-config '{
    "Name": "adsense-csp-policy",
    "Comment": "CSP policy for Google AdSense integration",
    "SecurityHeadersConfig": {
      "ContentSecurityPolicy": {
        "Override": true,
        "ContentSecurityPolicy": "default-src '\''self'\''; script-src '\''self'\'' '\''unsafe-inline'\'' https://pagead2.googlesyndication.com https://www.googletagservices.com https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src '\''self'\'' '\''unsafe-inline'\'' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src '\''self'\'' data: https://pagead2.googlesyndication.com https://www.google.com https://www.gstatic.com https://tpc.googlesyndication.com; frame-src https://www.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; connect-src '\''self'\'' https://pagead2.googlesyndication.com https://www.google.com; frame-ancestors '\''self'\''"
      }
    }
  }' \
  --profile goker

# Get the distribution config
aws cloudfront get-distribution-config --id E3CPZK9XL7GR6Q --profile goker > distribution-config.json

# Update the distribution to use the response headers policy
# (This requires manual editing of the JSON file and then using update-distribution)
```

### Option 3: Via CloudFormation Template Update

Update your CloudFormation template to include:

```yaml
ResponseHeadersPolicy:
  Type: AWS::CloudFront::ResponseHeadersPolicy
  Properties:
    ResponseHeadersPolicyConfig:
      Name: adsense-csp-policy
      Comment: CSP policy for Google AdSense integration
      SecurityHeadersConfig:
        ContentSecurityPolicy:
          Override: true
          ContentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagservices.com https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https://pagead2.googlesyndication.com https://www.google.com https://www.gstatic.com https://tpc.googlesyndication.com; frame-src https://www.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; connect-src 'self' https://pagead2.googlesyndication.com https://www.google.com; frame-ancestors 'self'"

# Then attach to your distribution behavior
DefaultCacheBehavior:
  ResponseHeadersPolicyId: !Ref ResponseHeadersPolicy
```

## Why This Matters

1. **frame-ancestors**: Can only be set via HTTP headers, not meta tags
2. **Security**: Server-level CSP provides stronger security guarantees
3. **Consistency**: Ensures all responses have consistent security headers
4. **Google AdSense**: Prevents CSP violations that block ad loading

## Testing

After configuring CloudFront headers:

1. Wait 5-10 minutes for distribution to update
2. Test with: `curl -I https://cgttaxtool.uk/`
3. Look for `Content-Security-Policy` header in response
4. Check browser console - CSP violations should be resolved

## Current Status

- ✅ Meta CSP tags updated with `fundingchoicesmessages.google.com`
- ⏳ CloudFront header configuration needed for `frame-ancestors`
- ⏳ Complete CSP policy at CloudFront level recommended

## Next Steps

1. Configure CloudFront response headers policy (Option 1 recommended)
2. Test the complete setup
3. Enable Auto Ads in Google AdSense dashboard