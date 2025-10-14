import type { Request, Response, NextFunction } from 'express'

/**
 * Helper to securely fetch requests to the Ordnance Survey Maps API.
 * Preserves headers and streams binary/vector data correctly.
 */
export async function fetchFromOrdnanceSurvey(
  req: Request,
  res: Response,
  next: NextFunction,
  ordnanceSurveyApiUrl: string,
  accessToken: string,
) {
  try {
    const ordnanceSurveyResponse = await fetch(ordnanceSurveyApiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!ordnanceSurveyResponse.ok) {
      throw new Error(
        `[os-auth] Ordnance Survey request failed: ${ordnanceSurveyResponse.status} ${ordnanceSurveyResponse.statusText}`,
      )
    }

    // Preserve correct content type (JSON, PBF, etc.)
    res.setHeader('Content-Type', ordnanceSurveyResponse.headers.get('content-type') || 'application/octet-stream')

    // Convert binary data to a Node Buffer and send
    const buffer = Buffer.from(await ordnanceSurveyResponse.arrayBuffer())
    res.send(buffer)
  } catch (err) {
    console.error('[os-auth] Error fetching Ordnance Survey request:', err)
    next(err)
  }
}
