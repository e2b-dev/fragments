'use server'

export type EmailValidationResponse = {
  address: string
  status: string
  sub_status: string
  free_email: boolean
  account: string
  domain: string
  mx_found: boolean
  did_you_mean: string | null
  domain_age_days: string | null
  active_in_days: string | null
  smtp_provider: string | null
  mx_record: string | null
  firstname: string | null
  lastname: string | null
  gender: string | null
  country: string | null
  region: string | null
  city: string | null
  zipcode: string | null
  processed_at: string
}

export async function validateEmail(email: string): Promise<boolean> {
  if (!process.env.ZEROBOUNCE_API_KEY) {
    return true
  }

  const response = await fetch(
    `https://api.zerobounce.net/v2/validate?api_key=${process.env.ZEROBOUNCE_API_KEY}&email=${email}&ip_address=`,
  )

  const responseData = await response.json()

  const data = {
    ...responseData,
    mx_found:
      responseData.mx_found === 'true'
        ? true
        : responseData.mx_found === 'false'
          ? false
          : responseData.mx_found,
  } as EmailValidationResponse

  switch (data.status) {
    case 'invalid':
    case 'spamtrap':
    case 'abuse':
    case 'do_not_mail':
      return false
  }

  return true
}
