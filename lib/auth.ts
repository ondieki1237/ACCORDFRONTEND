const API_BASE_URL = "http://localhost:5000/api"

export interface User {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  role: string
  region: string
  territory: string
  department: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  region: string
  territory: string
  department: string
}

class AuthService {
  public getRefreshToken(): string | null {
    return this.refreshToken;
  }

  public setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }
  }
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private currentUser: User | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken")
      this.refreshToken = localStorage.getItem("refreshToken")
      const userData = localStorage.getItem("currentUser")
      if (userData) {
        try {
          this.currentUser = JSON.parse(userData)
        } catch (error) {
          console.error("Failed to parse user data:", error)
        }
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error("Login failed")
    }

    const json = await response.json();
    const { user, tokens } = json.data;
    const { accessToken, refreshToken } = tokens || {};
    this.setTokens(accessToken, refreshToken);
    this.setCurrentUser(user);
    return { user, accessToken, refreshToken };
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      throw new Error("Registration failed")
    }

    const json = await response.json();
    const { user, tokens } = json.data;
    const { accessToken, refreshToken } = tokens || {};
    this.setTokens(accessToken, refreshToken);
    this.setCurrentUser(user);
    return { user, accessToken, refreshToken };
  }

  async getCurrentUser(): Promise<User> {
    if (this.currentUser) {
      return this.currentUser
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get current user")
    }

    const user = await response.json()
    this.setCurrentUser(user)
    return user
  }

  getCurrentUserSync(): User | null {
    return this.currentUser
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })
    }

    this.clearTokens()
  }


  private setCurrentUser(user: User) {
    this.currentUser = user
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(user))
    }
  }

  private clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    this.currentUser = null

    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("currentUser")
    }
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }
}

export const authService = new AuthService()
