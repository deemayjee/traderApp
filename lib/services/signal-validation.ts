import type { CryptoSignal } from '@/lib/types/hyperliquid-types'

export interface ValidationResult {
  isValid: boolean
  riskScore: number // 1-100, higher means riskier
  message: string
}

export interface RiskParameters {
  maxPositionSize: number
  stopLossPercentage: number
  maxDrawdown: number
  volatilityThreshold: number
}

const DEFAULT_RISK_PARAMS: RiskParameters = {
  maxPositionSize: 0.1, // 10% of portfolio
  stopLossPercentage: 0.05, // 5% stop loss
  maxDrawdown: 0.15, // 15% maximum drawdown
  volatilityThreshold: 0.03 // 3% volatility threshold
}

export class SignalValidator {
  private riskParams: RiskParameters

  constructor(riskParams: Partial<RiskParameters> = {}) {
    this.riskParams = { ...DEFAULT_RISK_PARAMS, ...riskParams }
  }

  validateSignal(signal: CryptoSignal, currentPrice: number, volatility24h: number): ValidationResult {
    const validations: ValidationResult[] = [
      this.validatePriceDeviation(signal.priceValue, currentPrice),
      this.validateVolatility(volatility24h),
      this.validateConfidence(signal.confidence),
      this.validateTimeValidity(signal.time)
    ]

    // Combine all validations
    const failedValidations = validations.filter(v => !v.isValid)
    if (failedValidations.length > 0) {
      return {
        isValid: false,
        riskScore: Math.max(...validations.map(v => v.riskScore)),
        message: failedValidations.map(v => v.message).join(', ')
      }
    }

    // Calculate overall risk score
    const riskScore = this.calculateOverallRiskScore(validations)

    return {
      isValid: true,
      riskScore,
      message: `Signal validated with risk score ${riskScore}`
    }
  }

  private validatePriceDeviation(signalPrice: number, currentPrice: number): ValidationResult {
    const deviation = Math.abs(currentPrice - signalPrice) / signalPrice
    const maxDeviation = 0.02 // 2% maximum price deviation

    return {
      isValid: deviation <= maxDeviation,
      riskScore: Math.min(100, Math.floor(deviation * 1000)),
      message: deviation > maxDeviation ? `Price deviation of ${(deviation * 100).toFixed(2)}% exceeds maximum allowed` : ''
    }
  }

  private validateVolatility(volatility24h: number): ValidationResult {
    return {
      isValid: volatility24h <= this.riskParams.volatilityThreshold,
      riskScore: Math.min(100, Math.floor(volatility24h * 1000)),
      message: volatility24h > this.riskParams.volatilityThreshold ? `Volatility of ${(volatility24h * 100).toFixed(2)}% exceeds threshold` : ''
    }
  }

  private validateConfidence(confidence: number): ValidationResult {
    const minConfidence = 65 // Minimum 65% confidence required

    return {
      isValid: confidence >= minConfidence,
      riskScore: Math.min(100, Math.floor((100 - confidence) * 2)),
      message: confidence < minConfidence ? `Confidence of ${confidence}% is below minimum required` : ''
    }
  }

  private validateTimeValidity(signalTime: string): ValidationResult {
    // Convert relative time to timestamp
    const timeMap: { [key: string]: number } = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    }

    const match = signalTime.match(/(\d+)([mhd])/)
    if (!match) {
      return {
        isValid: false,
        riskScore: 100,
        message: 'Invalid time format'
      }
    }

    const [, value, unit] = match
    const milliseconds = parseInt(value) * timeMap[unit]
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours maximum signal age

    return {
      isValid: milliseconds <= maxAge,
      riskScore: Math.min(100, Math.floor((milliseconds / maxAge) * 100)),
      message: milliseconds > maxAge ? 'Signal is too old' : ''
    }
  }

  private calculateOverallRiskScore(validations: ValidationResult[]): number {
    const weights = {
      priceDeviation: 0.4,
      volatility: 0.3,
      confidence: 0.2,
      timeValidity: 0.1
    }

    return Math.floor(
      validations.reduce((score, validation, index) => {
        const weight = Object.values(weights)[index]
        return score + validation.riskScore * weight
      }, 0)
    )
  }

  calculatePositionSize(portfolioValue: number, riskScore: number): number {
    // Adjust position size based on risk score
    const riskFactor = 1 - (riskScore / 100)
    const maxPosition = portfolioValue * this.riskParams.maxPositionSize
    return maxPosition * riskFactor
  }

  calculateStopLoss(entryPrice: number, type: 'Buy' | 'Sell'): number {
    const stopLossAmount = entryPrice * this.riskParams.stopLossPercentage
    return type === 'Buy' 
      ? entryPrice - stopLossAmount 
      : entryPrice + stopLossAmount
  }
} 